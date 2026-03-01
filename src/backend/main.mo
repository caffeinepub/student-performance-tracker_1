import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Data Types
  type Student = {
    id : Nat;
    name : Text;
    grade : Text;
  };

  type Subject = {
    id : Nat;
    name : Text;
  };

  type Assessment = {
    id : Nat;
    name : Text;
    term : Text;
    date : Text;
    maxScore : Nat;
  };

  type Mark = {
    studentId : Nat;
    subjectId : Nat;
    assessmentId : Nat;
    score : Nat;
  };

  // Auto-increment IDs
  var nextStudentId = 1;
  var nextSubjectId = 1;
  var nextAssessmentId = 1;

  module Student {
    public func compare(student1 : Student, student2 : Student) : Order.Order {
      Nat.compare(student1.id, student2.id);
    };
  };

  module Subject {
    public func compare(subject1 : Subject, subject2 : Subject) : Order.Order {
      Nat.compare(subject1.id, subject2.id);
    };
  };

  module Assessment {
    public func compare(assessment1 : Assessment, assessment2 : Assessment) : Order.Order {
      Nat.compare(assessment1.id, assessment2.id);
    };
  };

  module Mark {
    public func compare(mark1 : Mark, mark2 : Mark) : Order.Order {
      switch (Nat.compare(mark1.studentId, mark2.studentId)) {
        case (#equal) {
          switch (Nat.compare(mark1.subjectId, mark2.subjectId)) {
            case (#equal) { Nat.compare(mark1.assessmentId, mark2.assessmentId) };
            case (order) { order };
          };
        };
        case (order) { order };
      };
    };
  };

  // Persistent Storage
  let students = Map.empty<Nat, Student>();
  let subjects = Map.empty<Nat, Subject>();
  let assessments = Map.empty<Nat, Assessment>();
  let marks = Map.empty<Text, Mark>();

  // Helper for mark keys
  func markKey(studentId : Nat, subjectId : Nat, assessmentId : Nat) : Text {
    studentId.toText() # "-" # subjectId.toText() # "-" # assessmentId.toText();
  };

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Student CRUD
  public shared ({ caller }) func createStudent(name : Text, grade : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can add students");
    };
    let studentId = nextStudentId;
    let student : Student = {
      id = studentId;
      name;
      grade;
    };
    students.add(studentId, student);
    nextStudentId += 1;
    studentId;
  };

  public shared ({ caller }) func updateStudent(id : Nat, name : Text, grade : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can update students");
    };
    switch (students.get(id)) {
      case (null) { Runtime.trap("Student not found") };
      case (?_) {
        let updatedStudent : Student = {
          id;
          name;
          grade;
        };
        students.add(id, updatedStudent);
      };
    };
  };

  public shared ({ caller }) func deleteStudent(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can delete students");
    };
    students.remove(id);
  };

  // Subject CRUD
  public shared ({ caller }) func createSubject(name : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can add subjects");
    };
    let subjectId = nextSubjectId;
    let subject : Subject = {
      id = subjectId;
      name;
    };
    subjects.add(subjectId, subject);
    nextSubjectId += 1;
    subjectId;
  };

  public shared ({ caller }) func updateSubject(id : Nat, name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can update subjects");
    };
    switch (subjects.get(id)) {
      case (null) { Runtime.trap("Subject not found") };
      case (?_) {
        let updatedSubject : Subject = {
          id;
          name;
        };
        subjects.add(id, updatedSubject);
      };
    };
  };

  public shared ({ caller }) func deleteSubject(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can delete subjects");
    };
    subjects.remove(id);
  };

  // Assessment CRUD
  public shared ({ caller }) func createAssessment(name : Text, term : Text, date : Text, maxScore : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can add assessments");
    };
    let assessmentId = nextAssessmentId;
    let assessment : Assessment = {
      id = assessmentId;
      name;
      term;
      date;
      maxScore;
    };
    assessments.add(assessmentId, assessment);
    nextAssessmentId += 1;
    assessmentId;
  };

  public shared ({ caller }) func updateAssessment(id : Nat, name : Text, term : Text, date : Text, maxScore : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can update assessments");
    };
    switch (assessments.get(id)) {
      case (null) { Runtime.trap("Assessment not found") };
      case (?_) {
        let updatedAssessment : Assessment = {
          id;
          name;
          term;
          date;
          maxScore;
        };
        assessments.add(id, updatedAssessment);
      };
    };
  };

  public shared ({ caller }) func deleteAssessment(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can delete assessments");
    };
    assessments.remove(id);
  };

  // Mark Management
  public shared ({ caller }) func addOrUpdateMark(studentId : Nat, subjectId : Nat, assessmentId : Nat, score : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can add marks");
    };
    let mark : Mark = {
      studentId;
      subjectId;
      assessmentId;
      score;
    };
    marks.add(markKey(studentId, subjectId, assessmentId), mark);
  };

  public shared ({ caller }) func deleteMark(studentId : Nat, subjectId : Nat, assessmentId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can delete marks");
    };
    marks.remove(markKey(studentId, subjectId, assessmentId));
  };

  public shared ({ caller }) func importMarks(bulkMarks : [Mark]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can import marks");
    };
    bulkMarks.forEach(
      func(mark) {
        marks.add(markKey(mark.studentId, mark.subjectId, mark.assessmentId), mark);
      }
    );
  };

  // Data Queries (open to all)
  public query ({ caller }) func getAllStudents() : async [Student] {
    students.values().toArray().sort();
  };

  public query ({ caller }) func getAllSubjects() : async [Subject] {
    subjects.values().toArray().sort();
  };

  public query ({ caller }) func getAllAssessments() : async [Assessment] {
    assessments.values().toArray().sort();
  };

  public query ({ caller }) func getMarksByStudent(studentId : Nat) : async [Mark] {
    let allMarks = marks.values().toArray();
    let filtered = allMarks.filter(
      func(mark) {
        mark.studentId == studentId;
      }
    );
    filtered.sort();
  };

  public query ({ caller }) func getMarksByAssessment(subjectId : Nat, assessmentId : Nat) : async [Mark] {
    let allMarks = marks.values().toArray();
    let filtered = allMarks.filter(
      func(mark) {
        mark.subjectId == subjectId and mark.assessmentId == assessmentId;
      }
    );
    filtered.sort();
  };

  public query ({ caller }) func getAllMarks() : async [Mark] {
    marks.values().toArray().sort();
  };
};
