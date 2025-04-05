import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum for user roles
export const roleEnum = pgEnum('role', ['student', 'lecturer', 'admin']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull().default('student'),
  studentId: text("student_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  lecturerId: integer("lecturer_id").references(() => users.id),
  semester: text("semester"),
  academicYear: text("academic_year"),
});

// Student-Course enrollments
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
});

// Course sessions (specific class meetings)
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  location: text("location"),
});

// Attendance records
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  present: boolean("present").notNull().default(false),
  timestamp: timestamp("timestamp").defaultNow(),
  markedById: integer("marked_by_id").references(() => users.id),
});

// Exams table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  location: text("location"),
  minimumAttendance: integer("minimum_attendance"), // percentage required for eligibility
});

// Student exam eligibility
export const examEligibility = pgTable("exam_eligibility", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  eligible: boolean("eligible").notNull().default(false),
  verifiedById: integer("verified_by_id").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
});

// Exam attendance
export const examAttendance = pgTable("exam_attendance", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  present: boolean("present").notNull().default(true),
  markedById: integer("marked_by_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Activities log
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  isPinned: boolean("is_pinned").default(false),
  isGlobal: boolean("is_global").default(false),
  expiresAt: timestamp("expires_at"),
});

// Event categories
export const eventCategoryEnum = pgEnum('event_category', ['academic', 'administrative', 'social', 'holiday']);

// Events table (institution-wide events like ceremonies, holidays)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  organizedById: integer("organized_by_id").references(() => users.id),
  category: eventCategoryEnum("category").default('academic'),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recurring session options: ONCE, DAILY, WEEKLY, BIWEEKLY, MONTHLY
export const recurrenceTypeEnum = pgEnum('recurrence_type', ['once', 'daily', 'weekly', 'biweekly', 'monthly']);

// Timetable entries
export const timetable = pgTable("timetable", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  lecturerId: integer("lecturer_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  dayOfWeek: integer("day_of_week"), // 0-6 for Sunday-Saturday
  startTime: text("start_time").notNull(), // 'HH:MM' format
  endTime: text("end_time").notNull(), // 'HH:MM' format
  location: text("location"),
  recurrenceType: recurrenceTypeEnum("recurrence_type").default('weekly'),
  startDate: date("start_date").notNull(), // Semester start
  endDate: date("end_date").notNull(), // Semester end
  createdAt: timestamp("created_at").defaultNow(),
});

// Resource types
export const resourceTypeEnum = pgEnum('resource_type', ['lecture_note', 'slide', 'pdf', 'assignment', 'other']);

// Course resources
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  type: resourceTypeEnum("type").default('other'),
  url: text("url").notNull(), // URL to the resource
  uploadedById: integer("uploaded_by_id").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  isPublic: boolean("is_public").default(true),
});

// Announcement recipients (if targeting specific students instead of whole course)
export const announcementRecipients = pgTable("announcement_recipients", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").notNull().references(() => announcements.id, { onDelete: 'cascade' }),
  studentId: integer("student_id").notNull().references(() => users.id),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
});

// Define relations for users
export const usersRelations = relations(users, ({ many, one }: { many: any; one: any }) => ({
  taughtCourses: many(courses, { relationName: "course_lecturer" }),
  enrollments: many(enrollments, { relationName: "student_enrollments" }),
  attendance: many(attendance, { relationName: "student_attendance" }),
  markedAttendances: many(attendance, { relationName: "attendance_marker" }),
  examEligibilities: many(examEligibility, { relationName: "student_eligibilities" }),
  verifiedEligibilities: many(examEligibility, { relationName: "eligibility_verifier" }),
  activities: many(activities, { relationName: "user_activities" }),
  announcements: many(announcements, { relationName: "user_announcements" }),
  announcementRecipients: many(announcementRecipients, { relationName: "student_announcements" }),
  organizedEvents: many(events, { relationName: "event_organizer" }),
  timetableEntries: many(timetable, { relationName: "lecturer_timetable" }),
  uploadedResources: many(resources, { relationName: "user_resources" }),
}));

// Define relations for courses
export const coursesRelations = relations(courses, ({ many, one }: { many: any; one: any }) => ({
  lecturer: one(users, {
    fields: [courses.lecturerId],
    references: [users.id],
    relationName: "course_lecturer",
  }),
  enrollments: many(enrollments, { relationName: "course_enrollments" }),
  sessions: many(sessions, { relationName: "course_sessions" }),
  exams: many(exams, { relationName: "course_exams" }),
  announcements: many(announcements, { relationName: "course_announcements" }),
  timetableEntries: many(timetable, { relationName: "course_timetable" }),
  resources: many(resources, { relationName: "course_resources" }),
}));

// Define relations for enrollments
export const enrollmentsRelations = relations(enrollments, ({ one }: { one: any }) => ({
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id],
    relationName: "student_enrollments",
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
    relationName: "course_enrollments",
  }),
}));

// Define relations for sessions
export const sessionsRelations = relations(sessions, ({ one, many }: { one: any; many: any }) => ({
  course: one(courses, {
    fields: [sessions.courseId],
    references: [courses.id],
    relationName: "course_sessions",
  }),
  attendances: many(attendance, { relationName: "session_attendances" }),
}));

// Define relations for attendance
export const attendanceRelations = relations(attendance, ({ one }: { one: any }) => ({
  session: one(sessions, {
    fields: [attendance.sessionId],
    references: [sessions.id],
    relationName: "session_attendances",
  }),
  student: one(users, {
    fields: [attendance.studentId],
    references: [users.id],
    relationName: "student_attendance",
  }),
  markedBy: one(users, {
    fields: [attendance.markedById],
    references: [users.id],
    relationName: "attendance_marker",
  }),
}));

// Define relations for exams
export const examsRelations = relations(exams, ({ one, many }: { one: any; many: any }) => ({
  course: one(courses, {
    fields: [exams.courseId],
    references: [courses.id],
    relationName: "course_exams",
  }),
  eligibilities: many(examEligibility, { relationName: "exam_eligibilities" }),
}));

// Define relations for exam eligibility
export const examEligibilityRelations = relations(examEligibility, ({ one }: { one: any }) => ({
  exam: one(exams, {
    fields: [examEligibility.examId],
    references: [exams.id],
    relationName: "exam_eligibilities",
  }),
  student: one(users, {
    fields: [examEligibility.studentId],
    references: [users.id],
    relationName: "student_eligibilities",
  }),
  verifiedBy: one(users, {
    fields: [examEligibility.verifiedById],
    references: [users.id],
    relationName: "eligibility_verifier",
  }),
}));

// Define relations for activities
export const activitiesRelations = relations(activities, ({ one }: { one: any }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
    relationName: "user_activities",
  }),
}));

// Define relations for announcements
export const announcementsRelations = relations(announcements, ({ one, many }: { one: any; many: any }) => ({
  course: one(courses, {
    fields: [announcements.courseId],
    references: [courses.id],
    relationName: "course_announcements",
  }),
  creator: one(users, {
    fields: [announcements.createdById],
    references: [users.id],
    relationName: "user_announcements",
  }),
  recipients: many(announcementRecipients, { relationName: "announcement_recipients" }),
}));

// Define relations for announcement recipients
export const announcementRecipientsRelations = relations(announcementRecipients, ({ one }: { one: any }) => ({
  announcement: one(announcements, {
    fields: [announcementRecipients.announcementId],
    references: [announcements.id],
    relationName: "announcement_recipients",
  }),
  student: one(users, {
    fields: [announcementRecipients.studentId],
    references: [users.id],
    relationName: "student_announcements",
  }),
}));

// Define relations for events
export const eventsRelations = relations(events, ({ one }: { one: any }) => ({
  organizer: one(users, {
    fields: [events.organizedById],
    references: [users.id],
    relationName: "event_organizer",
  }),
}));

// Define relations for timetable
export const timetableRelations = relations(timetable, ({ one }: { one: any }) => ({
  course: one(courses, {
    fields: [timetable.courseId],
    references: [courses.id],
    relationName: "course_timetable",
  }),
  lecturer: one(users, {
    fields: [timetable.lecturerId],
    references: [users.id],
    relationName: "lecturer_timetable",
  }),
}));

// Define relations for resources
export const resourcesRelations = relations(resources, ({ one }: { one: any }) => ({
  course: one(courses, {
    fields: [resources.courseId],
    references: [courses.id],
    relationName: "course_resources",
  }),
  uploadedBy: one(users, {
    fields: [resources.uploadedById],
    references: [users.id],
    relationName: "user_resources",
  }),
}));

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrollmentDate: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  timestamp: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
});

export const insertExamEligibilitySchema = createInsertSchema(examEligibility).omit({
  id: true,
  verifiedAt: true,
});

export const insertExamAttendanceSchema = createInsertSchema(examAttendance).omit({
  id: true,
  timestamp: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export const insertAnnouncementRecipientSchema = createInsertSchema(announcementRecipients).omit({
  id: true,
  readAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertTimetableEntrySchema = createInsertSchema(timetable).omit({
  id: true,
  createdAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  uploadedAt: true,
});

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

// Data types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;

export type InsertExamEligibility = z.infer<typeof insertExamEligibilitySchema>;
export type ExamEligibility = typeof examEligibility.$inferSelect;

export type InsertExamAttendance = z.infer<typeof insertExamAttendanceSchema>;
export type ExamAttendance = typeof examAttendance.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

export type InsertAnnouncementRecipient = z.infer<typeof insertAnnouncementRecipientSchema>;
export type AnnouncementRecipient = typeof announcementRecipients.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertTimetableEntry = z.infer<typeof insertTimetableEntrySchema>;
export type TimetableEntry = typeof timetable.$inferSelect;

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

export type LoginCredentials = z.infer<typeof loginSchema>;
