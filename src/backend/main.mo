import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
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

  type BehaviourRecord = {
    studentId : Nat;
    behaviourComment : Text;
    advice : Text;
  };

  type UserProfile = {
    name : Text;
  };

  var nextStudentId = 1;
  var nextSubjectId = 1;
  var nextAssessmentId = 1;

  func compareStudents(student1 : Student, student2 : Student) : Order.Order {
    Nat.compare(student1.id, student2.id);
  };

  func compareSubjects(subject1 : Subject, subject2 : Subject) : Order.Order {
    Nat.compare(subject1.id, subject2.id);
  };

  func compareAssessments(assessment1 : Assessment, assessment2 : Assessment) : Order.Order {
    Nat.compare(assessment1.id, assessment2.id);
  };

  func compareMarks(mark1 : Mark, mark2 : Mark) : Order.Order {
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

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let students = Map.empty<Nat, Student>();
  let subjects = Map.empty<Nat, Subject>();
  let assessments = Map.empty<Nat, Assessment>();
  let marks = Map.empty<Text, Mark>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let behaviourRecords = Map.empty<Nat, BehaviourRecord>();

  func markKey(studentId : Nat, subjectId : Nat, assessmentId : Nat) : Text {
    studentId.toText() # "-" # subjectId.toText() # "-" # assessmentId.toText();
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.notEqual(user) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Behaviour Record Functions
  public shared ({ caller }) func saveBehaviourRecord(studentId : Nat, behaviourComment : Text, advice : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can save behaviour records");
    };
    let record : BehaviourRecord = {
      studentId;
      behaviourComment;
      advice;
    };
    behaviourRecords.add(studentId, record);
  };

  public query func getBehaviourRecord(studentId : Nat) : async ?BehaviourRecord {
    behaviourRecords.get(studentId);
  };

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
    bulkMarks.forEach(func(mark) { marks.add(markKey(mark.studentId, mark.subjectId, mark.assessmentId), mark) });
  };

  // Query Functions - Protected with user authorization
  public query ({ caller }) func getAllStudents() : async [Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can view students");
    };
    students.values().toArray().sort(compareStudents);
  };

  public query ({ caller }) func getAllSubjects() : async [Subject] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can view subjects");
    };
    subjects.values().toArray().sort(compareSubjects);
  };

  public query ({ caller }) func getAllAssessments() : async [Assessment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can view assessments");
    };
    assessments.values().toArray().sort(compareAssessments);
  };

  public query ({ caller }) func getAllMarks() : async [Mark] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can view marks");
    };
    marks.values().toArray().sort(compareMarks);
  };

  public query ({ caller }) func getMarksByStudent(studentId : Nat) : async [Mark] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can view marks");
    };
    let allMarks = marks.values().toArray();
    let filtered = allMarks.filter(func(mark) { mark.studentId == studentId });
    filtered.sort(compareMarks);
  };

  public query ({ caller }) func getMarksByAssessment(subjectId : Nat, assessmentId : Nat) : async [Mark] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teachers can view marks");
    };
    let allMarks = marks.values().toArray();
    let filtered = allMarks.filter(func(mark) { mark.subjectId == subjectId and mark.assessmentId == assessmentId });
    filtered.sort(compareMarks);
  };
};
