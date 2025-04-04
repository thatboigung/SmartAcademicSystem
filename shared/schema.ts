import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
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

// Activities log
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
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

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
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

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type LoginCredentials = z.infer<typeof loginSchema>;
