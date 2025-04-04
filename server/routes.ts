import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, hasRole, login, logout, getCurrentUser } from "./auth";
import { generateQRToken, verifyQRToken, checkExamEligibility } from "./qrcode";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import {
  insertUserSchema,
  insertCourseSchema,
  insertSessionSchema,
  insertAttendanceSchema,
  insertExamSchema,
  insertExamEligibilitySchema,
  insertEnrollmentSchema
} from "@shared/schema";
import { z } from "zod";

const PgSession = connectPgSimple(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "sams-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
      store: new PgSession({
        conObject: {
          connectionString: process.env.DATABASE_URL,
        },
        createTableIfMissing: true,
      }),
    })
  );

  // Authentication routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", isAuthenticated, logout);
  app.get("/api/auth/user", getCurrentUser);

  // User routes
  app.get("/api/users", isAuthenticated, hasRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const role = req.query.role as string | undefined;
      const users = await storage.getUsers(role);
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/users", isAuthenticated, hasRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...safeUser } = user; // Remove password from response
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  // Course routes
  app.get("/api/courses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const lecturerId = req.query.lecturerId ? Number(req.query.lecturerId) : undefined;
      let courses;
      
      if (lecturerId) {
        courses = await storage.getCoursesByLecturer(lecturerId);
      } else {
        courses = await storage.getCourses();
      }
      
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching courses" });
    }
  });

  app.post("/api/courses", isAuthenticated, hasRole(["admin", "lecturer"]), async (req: Request, res: Response) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error creating course" });
    }
  });

  // Session routes
  app.get("/api/sessions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
      
      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }
      
      const sessions = await storage.getSessionsByCourse(courseId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sessions" });
    }
  });

  app.post("/api/sessions", isAuthenticated, hasRole(["admin", "lecturer"]), async (req: Request, res: Response) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error creating session" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;
      const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      
      if (sessionId) {
        const attendances = await storage.getAttendanceBySession(sessionId);
        return res.json(attendances);
      }
      
      if (studentId) {
        const attendances = await storage.getAttendanceByStudent(studentId);
        return res.json(attendances);
      }
      
      return res.status(400).json({ message: "Either session ID or student ID is required" });
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendance" });
    }
  });

  app.post("/api/attendance", isAuthenticated, hasRole(["admin", "lecturer"]), async (req: Request, res: Response) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(attendanceData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "Attendance Recorded",
        details: `Recorded attendance for student ${attendanceData.studentId} in session ${attendanceData.sessionId}`,
      });
      
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error recording attendance" });
    }
  });

  // QR code routes
  app.get("/api/qrcode", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const token = await generateQRToken(req.session.userId!);
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: "Error generating QR code" });
    }
  });

  app.post("/api/qrcode/verify", isAuthenticated, hasRole(["admin", "lecturer"]), async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      const userId = verifyQRToken(token);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user data without password
      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: "Error verifying QR code" });
    }
  });

  // Exam routes
  app.get("/api/exams", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
      
      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }
      
      const exams = await storage.getExamsByCourse(courseId);
      res.json(exams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching exams" });
    }
  });

  app.post("/api/exams", isAuthenticated, hasRole(["admin", "lecturer"]), async (req: Request, res: Response) => {
    try {
      const examData = insertExamSchema.parse(req.body);
      const exam = await storage.createExam(examData);
      res.status(201).json(exam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error creating exam" });
    }
  });

  // Exam eligibility routes
  app.get("/api/eligibility", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const examId = req.query.examId ? Number(req.query.examId) : undefined;
      const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      
      if (examId) {
        const eligibilities = await storage.getExamEligibilityByExam(examId);
        return res.json(eligibilities);
      }
      
      if (studentId) {
        const eligibilities = await storage.getExamEligibilityByStudent(studentId);
        return res.json(eligibilities);
      }
      
      return res.status(400).json({ message: "Either exam ID or student ID is required" });
    } catch (error) {
      res.status(500).json({ message: "Error fetching eligibility" });
    }
  });

  app.post("/api/eligibility/check", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { studentId, examId } = req.body;
      
      if (!studentId || !examId) {
        return res.status(400).json({ message: "Student ID and exam ID are required" });
      }
      
      const isEligible = await checkExamEligibility(studentId, examId);
      res.json({ eligible: isEligible });
    } catch (error) {
      res.status(500).json({ message: "Error checking eligibility" });
    }
  });

  app.post("/api/eligibility", isAuthenticated, hasRole(["admin", "lecturer"]), async (req: Request, res: Response) => {
    try {
      const eligibilityData = insertExamEligibilitySchema.parse(req.body);
      const eligibility = await storage.createExamEligibility(eligibilityData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "Eligibility Verified",
        details: `Verified eligibility for student ${eligibilityData.studentId} for exam ${eligibilityData.examId}`,
      });
      
      res.status(201).json(eligibility);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error creating eligibility" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
      const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      
      if (courseId) {
        const enrollments = await storage.getEnrollmentsByCourse(courseId);
        return res.json(enrollments);
      }
      
      if (studentId) {
        const enrollments = await storage.getEnrollmentsByStudent(studentId);
        return res.json(enrollments);
      }
      
      return res.status(400).json({ message: "Either course ID or student ID is required" });
    } catch (error) {
      res.status(500).json({ message: "Error fetching enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, hasRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const enrollmentData = insertEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error creating enrollment" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      
      if (userId) {
        const activities = await storage.getActivitiesByUser(userId);
        return res.json(activities);
      }
      
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
