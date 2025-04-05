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
  insertEnrollmentSchema,
  insertAnnouncementSchema,
  insertAnnouncementRecipientSchema,
  insertEventSchema,
  insertTimetableEntrySchema,
  insertResourceSchema
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
  
  // Get today's exams
  app.get("/api/exams/today", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const exams = await storage.getExamsByDateRange(today, tomorrow);
      res.json(exams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching today's exams" });
    }
  });
  
  // Get exams for a specific student
  app.get("/api/exams/student/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const studentId = Number(req.params.id);
      
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      const exams = await storage.getExamsByStudentId(studentId);
      res.json(exams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student exams" });
    }
  });
  
  // Mark exam attendance
  app.post("/api/exams/attendance", isAuthenticated, hasRole(["admin", "lecturer"]), async (req: Request, res: Response) => {
    try {
      const { studentId, examId, present, markedById } = req.body;
      
      if (!studentId || !examId) {
        return res.status(400).json({ message: "Student ID and exam ID are required" });
      }
      
      const attendance = await storage.recordExamAttendance({
        studentId,
        examId, 
        present: present ?? true,
        markedById: markedById ?? req.session.userId!,
        timestamp: new Date()
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "Exam Attendance",
        details: `Marked attendance for student ${studentId} for exam ${examId}`,
      });
      
      res.status(201).json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Error recording exam attendance" });
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

  // Announcement routes
  app.get("/api/announcements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
      const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      
      if (courseId) {
        const announcements = await storage.getAnnouncementsByCourse(courseId);
        return res.json(announcements);
      }

      if (studentId) {
        const announcements = await storage.getAnnouncementsForStudent(studentId);
        return res.json(announcements);
      }
      
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching announcements" });
    }
  });

  app.post("/api/announcements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        createdById: req.session.userId
      });
      
      const announcement = await storage.createAnnouncement(announcementData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "Announcement Created",
        details: `Created announcement: ${announcementData.title}`,
      });
      
      res.status(201).json(announcement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error creating announcement" });
    }
  });

  // Announcement recipients routes
  app.post("/api/announcement-recipients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { announcementId, studentIds } = req.body;
      
      if (!announcementId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "Announcement ID and student IDs are required" });
      }
      
      const recipients = [];
      
      for (const studentId of studentIds) {
        const recipient = await storage.createAnnouncementRecipient({
          announcementId,
          studentId,
          isRead: false,
        });
        
        recipients.push(recipient);
      }
      
      res.status(201).json(recipients);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error adding announcement recipients" });
    }
  });

  app.put("/api/announcement-recipients/:id/mark-read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid announcement recipient ID" });
      }
      
      const recipient = await storage.markAnnouncementAsRead(id);
      
      if (!recipient) {
        return res.status(404).json({ message: "Announcement recipient not found" });
      }
      
      res.json(recipient);
    } catch (error) {
      res.status(500).json({ message: "Error marking announcement as read" });
    }
  });

  // Event routes
  app.get("/api/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      let events;
      
      if (startDate && endDate) {
        events = await storage.getEventsByDateRange(startDate, endDate);
      } else if (category) {
        events = await storage.getEventsByCategory(category);
      } else {
        events = await storage.getEvents();
      }
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  app.post("/api/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventData = insertEventSchema.parse({
        ...req.body,
        organizedById: req.session.userId
      });
      
      const event = await storage.createEvent(eventData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "Event Created",
        details: `Created event: ${eventData.title}`,
      });
      
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error creating event" });
    }
  });

  // Timetable routes
  app.get("/api/timetable", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
      const lecturerId = req.query.lecturerId ? Number(req.query.lecturerId) : undefined;
      const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      
      if (courseId) {
        const entries = await storage.getTimetableByCourse(courseId);
        return res.json(entries);
      }
      
      if (lecturerId) {
        const entries = await storage.getTimetableByLecturer(lecturerId);
        return res.json(entries);
      }
      
      if (studentId) {
        const entries = await storage.getTimetableForStudent(studentId);
        return res.json(entries);
      }
      
      const entries = await storage.getTimetableEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching timetable entries" });
    }
  });

  app.post("/api/timetable", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const timetableData = insertTimetableEntrySchema.parse(req.body);
      const entry = await storage.createTimetableEntry(timetableData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "Timetable Entry Created",
        details: `Created timetable entry: ${timetableData.title} for course ${timetableData.courseId}`,
      });
      
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error creating timetable entry" });
    }
  });

  // Resource routes
  app.get("/api/resources", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
      const type = req.query.type as string | undefined;
      const uploaderId = req.query.uploaderId ? Number(req.query.uploaderId) : undefined;
      
      if (courseId) {
        const resources = await storage.getResourcesByCourse(courseId);
        return res.json(resources);
      }
      
      if (type) {
        const resources = await storage.getResourcesByType(type);
        return res.json(resources);
      }
      
      if (uploaderId) {
        const resources = await storage.getResourcesByUploader(uploaderId);
        return res.json(resources);
      }
      
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resources" });
    }
  });
  
  app.get("/api/resources/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const resourceId = Number(req.params.id);
      
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      const resource = await storage.getResource(resourceId);
      
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resource" });
    }
  });
  
  app.post("/api/resources", isAuthenticated, hasRole(["admin", "lecturer"]), async (req: Request, res: Response) => {
    try {
      const resourceData = insertResourceSchema.parse({
        ...req.body,
        uploadedById: req.session.userId
      });
      
      const resource = await storage.createResource(resourceData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "Resource Uploaded",
        details: `Uploaded resource: ${resourceData.title} for course ${resourceData.courseId}`,
      });
      
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", details: error.format() });
      }
      res.status(500).json({ message: "Error creating resource" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
