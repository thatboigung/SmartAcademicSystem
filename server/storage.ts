import {
  users, courses, enrollments, sessions, attendance, exams, examEligibility, activities,
  type User, type InsertUser, type Course, type InsertCourse, type Enrollment, type InsertEnrollment,
  type Session, type InsertSession, type Attendance, type InsertAttendance, type Exam, type InsertExam,
  type ExamEligibility, type InsertExamEligibility, type Activity, type InsertActivity
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(role?: string): Promise<User[]>;

  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCourses(): Promise<Course[]>;
  getCoursesByLecturer(lecturerId: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;

  // Enrollment operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  deleteEnrollment(id: number): Promise<boolean>;

  // Session operations
  getSession(id: number): Promise<Session | undefined>;
  getSessionsByCourse(courseId: number): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<Session | undefined>;

  // Attendance operations
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceBySession(sessionId: number): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  getStudentAttendanceRate(studentId: number, courseId: number): Promise<number>;

  // Exam operations
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByCourse(courseId: number): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined>;

  // Exam eligibility operations
  getExamEligibility(id: number): Promise<ExamEligibility | undefined>;
  getExamEligibilityByExam(examId: number): Promise<ExamEligibility[]>;
  getExamEligibilityByStudent(studentId: number): Promise<ExamEligibility[]>;
  createExamEligibility(eligibility: InsertExamEligibility): Promise<ExamEligibility>;
  updateExamEligibility(id: number, eligibility: Partial<InsertExamEligibility>): Promise<ExamEligibility | undefined>;
  checkStudentEligibility(studentId: number, examId: number): Promise<boolean>;

  // Activity operations
  getActivity(id: number): Promise<Activity | undefined>;
  getActivities(limit?: number): Promise<Activity[]>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private enrollments: Map<number, Enrollment>;
  private sessions: Map<number, Session>;
  private attendances: Map<number, Attendance>;
  private exams: Map<number, Exam>;
  private examEligibilities: Map<number, ExamEligibility>;
  private activities: Map<number, Activity>;
  
  // IDs for auto-increment
  private userId: number;
  private courseId: number;
  private enrollmentId: number;
  private sessionId: number;
  private attendanceId: number;
  private examId: number;
  private examEligibilityId: number;
  private activityId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.sessions = new Map();
    this.attendances = new Map();
    this.exams = new Map();
    this.examEligibilities = new Map();
    this.activities = new Map();
    
    this.userId = 1;
    this.courseId = 1;
    this.enrollmentId = 1;
    this.sessionId = 1;
    this.attendanceId = 1;
    this.examId = 1;
    this.examEligibilityId = 1;
    this.activityId = 1;

    // Add some sample data for testing
    this.initSampleData();
  }

  private initSampleData() {
    // Sample admin
    this.createUser({
      username: "admin",
      password: "password",
      firstName: "Admin",
      lastName: "User",
      email: "admin@sams.edu",
      role: "admin"
    });

    // Sample lecturer
    this.createUser({
      username: "lecturer",
      password: "password",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@sams.edu",
      role: "lecturer"
    });

    // Sample student
    this.createUser({
      username: "student",
      password: "password",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@sams.edu",
      role: "student",
      studentId: "ST12345"
    });

    // More sample data can be added as needed
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.studentId === studentId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(role?: string): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    if (role) {
      return allUsers.filter(user => user.role === role);
    }
    return allUsers;
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCoursesByLecturer(lecturerId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.lecturerId === lecturerId);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseId++;
    const course: Course = { ...insertCourse, id };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: number, updateData: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse: Course = { ...course, ...updateData };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(enrollment => enrollment.studentId === studentId);
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(enrollment => enrollment.courseId === courseId);
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentId++;
    const now = new Date();
    const enrollment: Enrollment = { ...insertEnrollment, id, enrollmentDate: now };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    return this.enrollments.delete(id);
  }

  // Session operations
  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getSessionsByCourse(courseId: number): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(session => session.courseId === courseId);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.sessionId++;
    const session: Session = { ...insertSession, id };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: number, updateData: Partial<InsertSession>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession: Session = { ...session, ...updateData };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  // Attendance operations
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendances.get(id);
  }

  async getAttendanceBySession(sessionId: number): Promise<Attendance[]> {
    return Array.from(this.attendances.values()).filter(attendance => attendance.sessionId === sessionId);
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return Array.from(this.attendances.values()).filter(attendance => attendance.studentId === studentId);
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceId++;
    const now = new Date();
    const attendance: Attendance = { ...insertAttendance, id, timestamp: now };
    this.attendances.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: number, updateData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const attendance = this.attendances.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance: Attendance = { ...attendance, ...updateData };
    this.attendances.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async getStudentAttendanceRate(studentId: number, courseId: number): Promise<number> {
    // Get all sessions for the course
    const courseSessions = await this.getSessionsByCourse(courseId);
    if (courseSessions.length === 0) return 0;
    
    // Get all attendance records for the student
    const studentAttendances = await this.getAttendanceByStudent(studentId);
    
    // Filter attendance records that match the course sessions and where the student was present
    const presentSessionIds = courseSessions.map(session => session.id);
    const presentAttendances = studentAttendances.filter(
      att => presentSessionIds.includes(att.sessionId) && att.present
    );
    
    // Calculate the attendance rate
    return (presentAttendances.length / courseSessions.length) * 100;
  }

  // Exam operations
  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async getExamsByCourse(courseId: number): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(exam => exam.courseId === courseId);
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const id = this.examId++;
    const exam: Exam = { ...insertExam, id };
    this.exams.set(id, exam);
    return exam;
  }

  async updateExam(id: number, updateData: Partial<InsertExam>): Promise<Exam | undefined> {
    const exam = this.exams.get(id);
    if (!exam) return undefined;
    
    const updatedExam: Exam = { ...exam, ...updateData };
    this.exams.set(id, updatedExam);
    return updatedExam;
  }

  // Exam eligibility operations
  async getExamEligibility(id: number): Promise<ExamEligibility | undefined> {
    return this.examEligibilities.get(id);
  }

  async getExamEligibilityByExam(examId: number): Promise<ExamEligibility[]> {
    return Array.from(this.examEligibilities.values()).filter(eligibility => eligibility.examId === examId);
  }

  async getExamEligibilityByStudent(studentId: number): Promise<ExamEligibility[]> {
    return Array.from(this.examEligibilities.values()).filter(eligibility => eligibility.studentId === studentId);
  }

  async createExamEligibility(insertEligibility: InsertExamEligibility): Promise<ExamEligibility> {
    const id = this.examEligibilityId++;
    const now = new Date();
    const eligibility: ExamEligibility = { ...insertEligibility, id, verifiedAt: insertEligibility.verifiedById ? now : undefined };
    this.examEligibilities.set(id, eligibility);
    return eligibility;
  }

  async updateExamEligibility(id: number, updateData: Partial<InsertExamEligibility>): Promise<ExamEligibility | undefined> {
    const eligibility = this.examEligibilities.get(id);
    if (!eligibility) return undefined;
    
    const now = new Date();
    const updatedEligibility: ExamEligibility = { 
      ...eligibility, 
      ...updateData,
      verifiedAt: updateData.verifiedById ? now : eligibility.verifiedAt
    };
    this.examEligibilities.set(id, updatedEligibility);
    return updatedEligibility;
  }

  async checkStudentEligibility(studentId: number, examId: number): Promise<boolean> {
    // Get the exam to check minimum attendance requirement
    const exam = await this.getExam(examId);
    if (!exam || !exam.minimumAttendance) return false;
    
    // Get the course for the exam
    const courseId = exam.courseId;
    
    // Calculate the student's attendance rate for the course
    const attendanceRate = await this.getStudentAttendanceRate(studentId, courseId);
    
    // Check if the attendance rate meets the minimum requirement
    return attendanceRate >= exam.minimumAttendance;
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivities(limit?: number): Promise<Activity[]> {
    const allActivities = Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (limit) {
      return allActivities.slice(0, limit);
    }
    return allActivities;
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const now = new Date();
    const activity: Activity = { ...insertActivity, id, timestamp: now };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
