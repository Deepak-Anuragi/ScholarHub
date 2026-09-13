import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../app";
import CourseModel from "../models/Course";
import StudentCourseModel from "../models/StudentCourse";
import { clearDb, closeDb, openDb, sessionFor } from "../test/helpers";

const app = createApp();

beforeAll(openDb);
beforeEach(clearDb);
afterAll(closeDb);

const admin = () => sessionFor("admin");

async function createCourse(createdBy: string) {
  return CourseModel.create({
    title: "UPSC Prelims Notes",
    subject: "General Studies",
    examTypes: ["UPSC"],
    fileUrl: "https://example.com/notes.pdf",
    createdBy,
    enrolledCount: 3,
  });
}

describe("PATCH /api/admin/courses/:id", () => {
  // Before this existed, fixing a title meant delete-and-recreate, which
  // orphaned every enrolment row pointing at the course.
  it("edits in place and leaves enrolments intact", async () => {
    const session = admin();
    const course = await createCourse(session.id);
    const student = sessionFor("student");
    await StudentCourseModel.create({ studentId: student.id, courseId: course._id });

    const res = await request(app)
      .patch(`/api/admin/courses/${String(course._id)}`)
      .set("Cookie", session.cookie)
      .send({ title: "UPSC Prelims Notes 2026", examTypes: ["UPSC", "SSC"] });

    expect(res.status).toBe(200);
    expect(res.body.course.title).toBe("UPSC Prelims Notes 2026");

    const saved = await CourseModel.findById(course._id);
    expect(saved?.title).toBe("UPSC Prelims Notes 2026");
    expect(saved?.examTypes).toEqual(["UPSC", "SSC"]);
    expect(saved?.subject).toBe("General Studies");
    expect(await StudentCourseModel.countDocuments({ courseId: course._id })).toBe(1);
  });

  it("ignores derived fields and keeps the required ones non-empty", async () => {
    const session = admin();
    const course = await createCourse(session.id);
    const other = sessionFor("admin");

    const ignored = await request(app)
      .patch(`/api/admin/courses/${String(course._id)}`)
      .set("Cookie", session.cookie)
      .send({ enrolledCount: 9999, createdBy: other.id });
    expect(ignored.status).toBe(400);

    const blank = await request(app)
      .patch(`/api/admin/courses/${String(course._id)}`)
      .set("Cookie", session.cookie)
      .send({ title: "   " });
    expect(blank.status).toBe(400);

    const saved = await CourseModel.findById(course._id);
    expect(saved?.enrolledCount).toBe(3);
    expect(String(saved?.createdBy)).toBe(session.id);
    expect(saved?.title).toBe("UPSC Prelims Notes");
  });

  it("404s for a course that does not exist", async () => {
    const session = admin();
    const res = await request(app)
      .patch("/api/admin/courses/64b8d9f0c1a2b3d4e5f6071a")
      .set("Cookie", session.cookie)
      .send({ title: "Ghost" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/admin/courses/:id", () => {
  it("refuses to remove a course students are enrolled in", async () => {
    const session = admin();
    const course = await createCourse(session.id);
    const student = sessionFor("student");
    await StudentCourseModel.create({ studentId: student.id, courseId: course._id });

    const res = await request(app)
      .delete(`/api/admin/courses/${String(course._id)}`)
      .set("Cookie", session.cookie);

    expect(res.status).toBe(409);
    expect(res.body.enrolledCount).toBe(1);
    expect(await CourseModel.countDocuments({ _id: course._id })).toBe(1);
  });

  it("removes the enrolments with the course when told to cascade", async () => {
    const session = admin();
    const course = await createCourse(session.id);
    const student = sessionFor("student");
    await StudentCourseModel.create({ studentId: student.id, courseId: course._id });

    const res = await request(app)
      .delete(`/api/admin/courses/${String(course._id)}?cascade=true`)
      .set("Cookie", session.cookie);

    expect(res.status).toBe(200);
    expect(res.body.removedEnrolments).toBe(1);
    expect(await CourseModel.countDocuments({ _id: course._id })).toBe(0);
    expect(await StudentCourseModel.countDocuments({ courseId: course._id })).toBe(0);
  });

  it("deletes a course nobody is enrolled in without a cascade flag", async () => {
    const session = admin();
    const course = await createCourse(session.id);

    const res = await request(app)
      .delete(`/api/admin/courses/${String(course._id)}`)
      .set("Cookie", session.cookie);

    expect(res.status).toBe(200);
    expect(await CourseModel.countDocuments({ _id: course._id })).toBe(0);
  });
});
