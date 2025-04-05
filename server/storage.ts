import {
  users, courses, enrollments, sessions, attendance, exams, examEligibility, activities,
  announcements, announcementRecipients, events, timetable, examAttendance, resources,
  type User, type InsertUser, type Course, type InsertCourse, type Enrollment, type InsertEnrollment,
  type Session, type InsertSession, type Attendance, type InsertAttendance, type Exam, type InsertExam,
  type ExamEligibility, type InsertExamEligibility, type Activity, type InsertActivity,
  type Announcement, type InsertAnnouncement, type AnnouncementRecipient, type InsertAnnouncementRecipient,
  type Event, type InsertEvent, type TimetableEntry, type InsertTimetableEntry,
  type ExamAttendance, type InsertExamAttendance, type Resource, type InsertResource
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, gte, lte, inArray } from "drizzle-orm";

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
  getExamsByDateRange(startDate: Date, endDate: Date): Promise<Exam[]>;
  getExamsByStudentId(studentId: number): Promise<any[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined>;
  recordExamAttendance(attendance: InsertExamAttendance): Promise<ExamAttendance>;

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
  
  // Announcement operations
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  getAnnouncements(): Promise<Announcement[]>;
  getAnnouncementsByCourse(courseId: number): Promise<Announcement[]>;
  getAnnouncementsForStudent(studentId: number): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  
  // Announcement recipient operations
  getAnnouncementRecipient(id: number): Promise<AnnouncementRecipient | undefined>;
  getAnnouncementRecipientsByAnnouncement(announcementId: number): Promise<AnnouncementRecipient[]>;
  getAnnouncementRecipientsByStudent(studentId: number): Promise<AnnouncementRecipient[]>;
  createAnnouncementRecipient(recipient: InsertAnnouncementRecipient): Promise<AnnouncementRecipient>;
  markAnnouncementAsRead(id: number): Promise<AnnouncementRecipient | undefined>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  getEventsByCategory(category: string): Promise<Event[]>;
  getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  
  // Timetable operations
  getTimetableEntry(id: number): Promise<TimetableEntry | undefined>;
  getTimetableEntries(): Promise<TimetableEntry[]>;
  getTimetableByCourse(courseId: number): Promise<TimetableEntry[]>;
  getTimetableByLecturer(lecturerId: number): Promise<TimetableEntry[]>;
  getTimetableForStudent(studentId: number): Promise<TimetableEntry[]>;
  createTimetableEntry(entry: InsertTimetableEntry): Promise<TimetableEntry>;
  
  // Resource operations
  getResource(id: number): Promise<Resource | undefined>;
  getResources(): Promise<Resource[]>;
  getResourcesByCourse(courseId: number): Promise<Resource[]>;
  getResourcesByType(type: string): Promise<Resource[]>;
  getResourcesByUploader(uploaderId: number): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private enrollments: Map<number, Enrollment>;
  private sessions: Map<number, Session>;
  private attendances: Map<number, Attendance>;
  private exams: Map<number, Exam>;
  private examEligibilities: Map<number, ExamEligibility>;
  private examAttendances: Map<number, ExamAttendance>;
  private activities: Map<number, Activity>;
  private announcements: Map<number, Announcement>;
  private announcementRecipients: Map<number, AnnouncementRecipient>;
  private events: Map<number, Event>;
  private timetableEntries: Map<number, TimetableEntry>;
  private resources: Map<number, Resource>;
  
  // IDs for auto-increment
  private userId: number;
  private courseId: number;
  private enrollmentId: number;
  private sessionId: number;
  private attendanceId: number;
  private examId: number;
  private examEligibilityId: number;
  private examAttendanceId: number;
  private activityId: number;
  private announcementId: number;
  private announcementRecipientId: number;
  private eventId: number;
  private timetableEntryId: number;
  private resourceId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.sessions = new Map();
    this.attendances = new Map();
    this.exams = new Map();
    this.examEligibilities = new Map();
    this.examAttendances = new Map();
    this.activities = new Map();
    this.announcements = new Map();
    this.announcementRecipients = new Map();
    this.events = new Map();
    this.timetableEntries = new Map();
    this.resources = new Map();
    
    this.userId = 1;
    this.courseId = 1;
    this.enrollmentId = 1;
    this.sessionId = 1;
    this.attendanceId = 1;
    this.examId = 1;
    this.examEligibilityId = 1;
    this.examAttendanceId = 1;
    this.activityId = 1;
    this.announcementId = 1;
    this.announcementRecipientId = 1;
    this.eventId = 1;
    this.timetableEntryId = 1;
    this.resourceId = 1;

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
  
  async getExamsByDateRange(startDate: Date, endDate: Date): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(exam => {
      const examDate = exam.date;
      return examDate >= startDate && examDate <= endDate;
    });
  }
  
  async getExamsByStudentId(studentId: number): Promise<Exam[]> {
    // Get all courses the student is enrolled in
    const enrollments = await this.getEnrollmentsByStudent(studentId);
    const courseIds = enrollments.map(enrollment => enrollment.courseId);
    
    // Get all exams for those courses
    return Array.from(this.exams.values()).filter(exam => courseIds.includes(exam.courseId));
  }
  
  async recordExamAttendance(insertAttendance: InsertExamAttendance): Promise<ExamAttendance> {
    const id = this.examAttendanceId++;
    const now = new Date();
    const attendance: ExamAttendance = { ...insertAttendance, id, timestamp: now };
    this.examAttendances.set(id, attendance);
    return attendance;
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

  // Announcement operations
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAnnouncementsByCourse(courseId: number): Promise<Announcement[]> {
    return Array.from(this.announcements.values())
      .filter(announcement => announcement.courseId === courseId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAnnouncementsForStudent(studentId: number): Promise<Announcement[]> {
    const studentUser = await this.getUser(studentId);
    if (!studentUser) return [];

    // Get all recipient records for this student
    const recipientRecords = Array.from(this.announcementRecipients.values())
      .filter(rec => rec.studentId === studentId);
    
    // Get announcement IDs from recipient records
    const announcementIds = recipientRecords.map(rec => rec.announcementId);
    
    // Return all announcements that match the IDs
    return Array.from(this.announcements.values())
      .filter(ann => announcementIds.includes(ann.id) || ann.isGlobal)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = this.announcementId++;
    const now = new Date();
    const announcement: Announcement = { ...insertAnnouncement, id, createdAt: now };
    this.announcements.set(id, announcement);
    return announcement;
  }

  // Announcement recipient operations
  async getAnnouncementRecipient(id: number): Promise<AnnouncementRecipient | undefined> {
    return this.announcementRecipients.get(id);
  }

  async getAnnouncementRecipientsByAnnouncement(announcementId: number): Promise<AnnouncementRecipient[]> {
    return Array.from(this.announcementRecipients.values())
      .filter(recipient => recipient.announcementId === announcementId);
  }

  async getAnnouncementRecipientsByStudent(studentId: number): Promise<AnnouncementRecipient[]> {
    return Array.from(this.announcementRecipients.values())
      .filter(recipient => recipient.studentId === studentId);
  }

  async createAnnouncementRecipient(insertRecipient: InsertAnnouncementRecipient): Promise<AnnouncementRecipient> {
    const id = this.announcementRecipientId++;
    const recipient: AnnouncementRecipient = { 
      ...insertRecipient, 
      id, 
      isRead: false,
      readAt: null 
    };
    this.announcementRecipients.set(id, recipient);
    return recipient;
  }

  async markAnnouncementAsRead(id: number): Promise<AnnouncementRecipient | undefined> {
    const recipient = this.announcementRecipients.get(id);
    if (!recipient) return undefined;
    
    const now = new Date();
    const updatedRecipient: AnnouncementRecipient = { 
      ...recipient, 
      isRead: true,
      readAt: now
    };
    this.announcementRecipients.set(id, updatedRecipient);
    return updatedRecipient;
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values())
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  async getEventsByCategory(category: string): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => event.category === category)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => {
        const eventStart = event.startDate;
        const eventEnd = new Date(eventStart.getTime() + event.duration * 60000); // duration is in minutes
        return eventStart >= startDate && eventEnd <= endDate;
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventId++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    return event;
  }

  // Timetable operations
  async getTimetableEntry(id: number): Promise<TimetableEntry | undefined> {
    return this.timetableEntries.get(id);
  }

  async getTimetableEntries(): Promise<TimetableEntry[]> {
    return Array.from(this.timetableEntries.values())
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  }

  async getTimetableByCourse(courseId: number): Promise<TimetableEntry[]> {
    return Array.from(this.timetableEntries.values())
      .filter(entry => entry.courseId === courseId)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  }

  async getTimetableByLecturer(lecturerId: number): Promise<TimetableEntry[]> {
    // Get all courses taught by this lecturer
    const lecturerCourses = await this.getCoursesByLecturer(lecturerId);
    const lecturerCourseIds = lecturerCourses.map(course => course.id);
    
    // Get all timetable entries for these courses
    return Array.from(this.timetableEntries.values())
      .filter(entry => lecturerCourseIds.includes(entry.courseId))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  }

  async getTimetableForStudent(studentId: number): Promise<TimetableEntry[]> {
    // Get all enrollments for this student
    const studentEnrollments = await this.getEnrollmentsByStudent(studentId);
    const enrolledCourseIds = studentEnrollments.map(enrollment => enrollment.courseId);
    
    // Get all timetable entries for these courses
    return Array.from(this.timetableEntries.values())
      .filter(entry => enrolledCourseIds.includes(entry.courseId))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  }

  async createTimetableEntry(insertEntry: InsertTimetableEntry): Promise<TimetableEntry> {
    const id = this.timetableEntryId++;
    const entry: TimetableEntry = { ...insertEntry, id };
    this.timetableEntries.set(id, entry);
    return entry;
  }

  // Resource operations
  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .sort((a, b) => {
        if (!a.uploadedAt || !b.uploadedAt) return 0;
        return b.uploadedAt.getTime() - a.uploadedAt.getTime();
      });
  }

  async getResourcesByCourse(courseId: number): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.courseId === courseId)
      .sort((a, b) => {
        if (!a.uploadedAt || !b.uploadedAt) return 0;
        return b.uploadedAt.getTime() - a.uploadedAt.getTime();
      });
  }

  async getResourcesByType(type: string): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.type === type)
      .sort((a, b) => {
        if (!a.uploadedAt || !b.uploadedAt) return 0;
        return b.uploadedAt.getTime() - a.uploadedAt.getTime();
      });
  }

  async getResourcesByUploader(uploaderId: number): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.uploadedById === uploaderId)
      .sort((a, b) => {
        if (!a.uploadedAt || !b.uploadedAt) return 0;
        return b.uploadedAt.getTime() - a.uploadedAt.getTime();
      });
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = this.resourceId++;
    const now = new Date();
    const resource: Resource = { ...insertResource, id, uploadedAt: now };
    this.resources.set(id, resource);
    return resource;
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.studentId, studentId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsers(role?: string): Promise<User[]> {
    if (role) {
      return db.select().from(users).where(eq(users.role, role));
    }
    return db.select().from(users);
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourses(): Promise<Course[]> {
    return db.select().from(courses);
  }

  async getCoursesByLecturer(lecturerId: number): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.lecturerId, lecturerId));
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async updateCourse(id: number, courseData: Partial<InsertCourse>): Promise<Course | undefined> {
    const [course] = await db.update(courses)
      .set(courseData)
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments)
      .values({
        ...insertEnrollment,
        enrollmentDate: new Date()
      })
      .returning();
    return enrollment;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    const result = await db.delete(enrollments).where(eq(enrollments.id, id)).returning();
    return result.length > 0;
  }

  // Session operations
  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async getSessionsByCourse(courseId: number): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.courseId, courseId));
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async updateSession(id: number, sessionData: Partial<InsertSession>): Promise<Session | undefined> {
    const [session] = await db.update(sessions)
      .set(sessionData)
      .where(eq(sessions.id, id))
      .returning();
    return session;
  }

  // Attendance operations
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const [att] = await db.select().from(attendance).where(eq(attendance.id, id));
    return att;
  }

  async getAttendanceBySession(sessionId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.sessionId, sessionId));
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [att] = await db.insert(attendance)
      .values({
        ...insertAttendance,
        timestamp: new Date()
      })
      .returning();
    return att;
  }

  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [att] = await db.update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return att;
  }

  async getStudentAttendanceRate(studentId: number, courseId: number): Promise<number> {
    // Get all sessions for the course
    const courseSessions = await this.getSessionsByCourse(courseId);
    if (courseSessions.length === 0) return 0;
    
    // Get all attendance records for the student that are in the course sessions
    const sessionIds = courseSessions.map(session => session.id);
    
    // Count attendance records where student was present
    const result = await db.select({
      count: count(),
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.studentId, studentId),
        eq(attendance.present, true),
        // Using sql query to check sessionId in the list because drizzle-orm doesn't have in() operator
        sql`${attendance.sessionId} IN (${sessionIds.join(',')})`
      )
    );
    
    // Calculate the attendance rate
    const presentCount = result[0]?.count || 0;
    return (Number(presentCount) / courseSessions.length) * 100;
  }

  // Exam operations
  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async getExamsByCourse(courseId: number): Promise<Exam[]> {
    return db.select().from(exams).where(eq(exams.courseId, courseId));
  }
  
  async getExamsByDateRange(startDate: Date, endDate: Date): Promise<Exam[]> {
    return db.select()
      .from(exams)
      .where(
        and(
          gte(exams.date, startDate),
          lte(exams.date, endDate)
        )
      );
  }
  
  async getExamsByStudentId(studentId: number): Promise<Exam[]> {
    // Get all enrollments for the student
    const studentEnrollments = await this.getEnrollmentsByStudent(studentId);
    const courseIds = studentEnrollments.map(enrollment => enrollment.courseId);
    
    if (courseIds.length === 0) return [];
    
    // Get all exams for those courses
    return db.select()
      .from(exams)
      .where(inArray(exams.courseId, courseIds));
  }
  
  async recordExamAttendance(insertAttendance: InsertExamAttendance): Promise<ExamAttendance> {
    const [attendance] = await db.insert(examAttendance)
      .values({
        ...insertAttendance,
        timestamp: new Date()
      })
      .returning();
    return attendance;
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const [exam] = await db.insert(exams).values(insertExam).returning();
    return exam;
  }

  async updateExam(id: number, examData: Partial<InsertExam>): Promise<Exam | undefined> {
    const [exam] = await db.update(exams)
      .set(examData)
      .where(eq(exams.id, id))
      .returning();
    return exam;
  }

  // Exam eligibility operations
  async getExamEligibility(id: number): Promise<ExamEligibility | undefined> {
    const [eligibility] = await db.select().from(examEligibility).where(eq(examEligibility.id, id));
    return eligibility;
  }

  async getExamEligibilityByExam(examId: number): Promise<ExamEligibility[]> {
    return db.select().from(examEligibility).where(eq(examEligibility.examId, examId));
  }

  async getExamEligibilityByStudent(studentId: number): Promise<ExamEligibility[]> {
    return db.select().from(examEligibility).where(eq(examEligibility.studentId, studentId));
  }

  async createExamEligibility(insertEligibility: InsertExamEligibility): Promise<ExamEligibility> {
    const verifiedAt = insertEligibility.verifiedById ? new Date() : undefined;
    const [eligibility] = await db.insert(examEligibility)
      .values({
        ...insertEligibility,
        verifiedAt
      })
      .returning();
    return eligibility;
  }

  async updateExamEligibility(id: number, eligibilityData: Partial<InsertExamEligibility>): Promise<ExamEligibility | undefined> {
    const verifiedAt = eligibilityData.verifiedById ? new Date() : undefined;
    const updateData = { ...eligibilityData };
    
    if (verifiedAt) {
      updateData.verifiedAt = verifiedAt;
    }
    
    const [eligibility] = await db.update(examEligibility)
      .set(updateData)
      .where(eq(examEligibility.id, id))
      .returning();
    return eligibility;
  }

  async checkStudentEligibility(studentId: number, examId: number): Promise<boolean> {
    // Get the exam to check minimum attendance requirement
    const exam = await this.getExam(examId);
    if (!exam || !exam.minimumAttendance) return false;
    
    // Calculate the student's attendance rate for the course
    const attendanceRate = await this.getStudentAttendanceRate(studentId, exam.courseId);
    
    // Check if the attendance rate meets the minimum requirement
    return attendanceRate >= exam.minimumAttendance;
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async getActivities(limit?: number): Promise<Activity[]> {
    const query = db.select().from(activities).orderBy(desc(activities.timestamp));
    
    if (limit) {
      // @ts-ignore - limit is not properly typed in drizzle-orm
      return query.limit(limit);
    }
    
    return query;
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities)
      .values({
        ...insertActivity,
        timestamp: new Date()
      })
      .returning();
    return activity;
  }

  // Announcement operations
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return db.select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
  }

  async getAnnouncementsByCourse(courseId: number): Promise<Announcement[]> {
    return db.select()
      .from(announcements)
      .where(eq(announcements.courseId, courseId))
      .orderBy(desc(announcements.createdAt));
  }

  async getAnnouncementsForStudent(studentId: number): Promise<Announcement[]> {
    // Get the student user
    const [student] = await db.select().from(users).where(eq(users.id, studentId));
    if (!student) return [];

    // Get announcements specifically for this student and global announcements
    const recipientAnnouncements = await db.select({
      announcementId: announcementRecipients.announcementId
    })
    .from(announcementRecipients)
    .where(eq(announcementRecipients.studentId, studentId));
    
    const announcementIds = recipientAnnouncements.map(r => r.announcementId);
    
    if (announcementIds.length === 0) {
      return db.select()
        .from(announcements)
        .where(eq(announcements.isGlobal, true))
        .orderBy(desc(announcements.createdAt));
    }
    
    // Use SQL to get either global announcements or those specifically for this student
    return db.select()
      .from(announcements)
      .where(
        sql`${announcements.isGlobal} = true OR ${announcements.id} IN (${announcementIds.join(',')})`
      )
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements)
      .values({
        ...insertAnnouncement,
        createdAt: new Date(),
        isGlobal: insertAnnouncement.isGlobal || false
      } as any)
      .returning();
    return announcement;
  }

  // Announcement recipient operations
  async getAnnouncementRecipient(id: number): Promise<AnnouncementRecipient | undefined> {
    const [recipient] = await db.select().from(announcementRecipients).where(eq(announcementRecipients.id, id));
    return recipient;
  }

  async getAnnouncementRecipientsByAnnouncement(announcementId: number): Promise<AnnouncementRecipient[]> {
    return db.select()
      .from(announcementRecipients)
      .where(eq(announcementRecipients.announcementId, announcementId));
  }

  async getAnnouncementRecipientsByStudent(studentId: number): Promise<AnnouncementRecipient[]> {
    return db.select()
      .from(announcementRecipients)
      .where(eq(announcementRecipients.studentId, studentId));
  }

  async createAnnouncementRecipient(insertRecipient: InsertAnnouncementRecipient): Promise<AnnouncementRecipient> {
    const [recipient] = await db.insert(announcementRecipients)
      .values({
        ...insertRecipient,
        isRead: false,
        readAt: null
      })
      .returning();
    return recipient;
  }

  async markAnnouncementAsRead(id: number): Promise<AnnouncementRecipient | undefined> {
    const [recipient] = await db.update(announcementRecipients)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(announcementRecipients.id, id))
      .returning();
    return recipient;
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEvents(): Promise<Event[]> {
    return db.select()
      .from(events)
      .orderBy(events.startDate);
  }

  async getEventsByCategory(category: string): Promise<Event[]> {
    return db.select()
      .from(events)
      .where(eq(events.category, category))
      .orderBy(events.startDate);
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return db.select()
      .from(events)
      .where(
        and(
          sql`${events.startDate} >= ${startDate.toISOString()}`,
          sql`DATE_ADD(${events.startDate}, INTERVAL ${events.duration} MINUTE) <= ${endDate.toISOString()}`
        )
      )
      .orderBy(events.startDate);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events)
      .values({
        ...insertEvent,
        createdAt: new Date()
      } as any)
      .returning();
    return event;
  }

  // Timetable operations
  async getTimetableEntry(id: number): Promise<TimetableEntry | undefined> {
    const [entry] = await db.select().from(timetable).where(eq(timetable.id, id));
    return entry;
  }

  async getTimetableEntries(): Promise<TimetableEntry[]> {
    return db.select()
      .from(timetable)
      .orderBy(timetable.dayOfWeek, timetable.startTime);
  }

  async getTimetableByCourse(courseId: number): Promise<TimetableEntry[]> {
    return db.select()
      .from(timetable)
      .where(eq(timetable.courseId, courseId))
      .orderBy(timetable.dayOfWeek, timetable.startTime);
  }

  async getTimetableByLecturer(lecturerId: number): Promise<TimetableEntry[]> {
    // Get all courses taught by this lecturer
    const lecturerCourses = await this.getCoursesByLecturer(lecturerId);
    const courseIds = lecturerCourses.map(course => course.id);
    
    if (courseIds.length === 0) {
      return [];
    }
    
    // Get timetable entries for these courses
    return db.select()
      .from(timetable)
      .where(sql`${timetable.courseId} IN (${courseIds.join(',')})`)
      .orderBy(timetable.dayOfWeek, timetable.startTime);
  }

  async getTimetableForStudent(studentId: number): Promise<TimetableEntry[]> {
    // Get all enrollments for this student
    const studentEnrollments = await this.getEnrollmentsByStudent(studentId);
    const courseIds = studentEnrollments.map(enrollment => enrollment.courseId);
    
    if (courseIds.length === 0) {
      return [];
    }
    
    // Get timetable entries for these courses
    return db.select()
      .from(timetable)
      .where(sql`${timetable.courseId} IN (${courseIds.join(',')})`)
      .orderBy(timetable.dayOfWeek, timetable.startTime);
  }

  async createTimetableEntry(insertEntry: InsertTimetableEntry): Promise<TimetableEntry> {
    const [entry] = await db.insert(timetable)
      .values({
        ...insertEntry,
        createdAt: new Date()
      } as any)
      .returning();
    return entry;
  }

  // Resource operations
  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async getResources(): Promise<Resource[]> {
    return db.select()
      .from(resources)
      .orderBy(desc(resources.uploadedAt));
  }

  async getResourcesByCourse(courseId: number): Promise<Resource[]> {
    return db.select()
      .from(resources)
      .where(eq(resources.courseId, courseId))
      .orderBy(desc(resources.uploadedAt));
  }

  async getResourcesByType(type: string): Promise<Resource[]> {
    return db.select()
      .from(resources)
      .where(eq(resources.type, type))
      .orderBy(desc(resources.uploadedAt));
  }

  async getResourcesByUploader(uploaderId: number): Promise<Resource[]> {
    return db.select()
      .from(resources)
      .where(eq(resources.uploadedById, uploaderId))
      .orderBy(desc(resources.uploadedAt));
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources)
      .values({
        ...insertResource,
        uploadedAt: new Date()
      })
      .returning();
    return resource;
  }
}

// Switch to database storage
export const storage = new DatabaseStorage();
