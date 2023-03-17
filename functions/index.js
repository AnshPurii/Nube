const Razorpay = require("razorpay");
const functions = require("firebase-functions");
const express = require("express");
const app = express();
const path = require("path");
const admin = require("firebase-admin");
const engine = require("ejs-mate");
const cors = require("cors")({ origin: true });
const nodemailer = require("nodemailer");
var crypto = require("crypto");
const bodyParser = require("body-parser");

// const { getVideoDurationInSeconds } = require('get-video-duration')
let Vimeo = require("vimeo").Vimeo;
let client = new Vimeo("", "", ""); //vimeo credentials here
var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "",
    pass: "", //smtp email credentials here
  },
});

const razorpaySecretKey = ""; //razorpay credentials here
// const razorpaySecretKey = ''

var instance = new Razorpay({
  key_id: "",
  // key_id: '',
  key_secret: razorpaySecretKey,
});

//Uncomment for development
// app.locals.devEnv='http://localhost:5000/'
// app.locals.prodEnv='https://nubefilmacademysite.web.app/'
// app.locals.devFun='http://localhost:5001/nubefilmacademysite/us-central1/app'
// app.locals.prodFun='https://us-central1-nubefilmacademysite.cloudfunctions.net/app'

// const devFun = "http://localhost:5001/nubefilmacademysite/us-central1/app";
// const prodFun ='https://us-central1-nubefilmacademysite.cloudfunctions.net/app'

//Uncomment for production
app.locals.devEnv = "https://nubefilmacademysite.web.app/";
app.locals.prodEnv = "https://nubefilmacademysite.web.app/";
app.locals.devFun =
  "https://us-central1-nubefilmacademysite.cloudfunctions.net/app";
app.locals.prodFun =
  "https://us-central1-nubefilmacademysite.cloudfunctions.net/app";

const devFun = "https://us-central1-nubefilmacademysite.cloudfunctions.net/app";
const prodFun =
  "https://us-central1-nubefilmacademysite.cloudfunctions.net/app";

function addZero(num) {
  if (num > 9) return num;
  else return "0" + num;
}

app.locals.durationUnit = (durationInSeconds) => {
  if (durationInSeconds < 60) {
    return durationInSeconds + " sec";
  } else if (durationInSeconds >= 60 && durationInSeconds < 3600) {
    return (
      addZero(parseInt(durationInSeconds / 60)) +
      ":" +
      addZero(parseInt(durationInSeconds % 60)) +
      " min"
    );
  } else {
    return (
      addZero(parseInt(durationInSeconds / 3600)) +
      ":" +
      addZero(parseInt(durationInSeconds % 60)) +
      " hr"
    );
  }
};

const methodOverride = require("method-override");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

function wrapAsync(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((e) => next(e));
  };
}

const adminApp = admin.initializeApp();
var db = admin.firestore();
exports.app = functions.https.onRequest(app);

app.engine("ejs", engine);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get(
  "/",
  wrapAsync(async (req, res, next) => {
    const testimonials = [],
      courses = [],
      modules = [],
      lectures = [];
    const testimonialsSnapshot = await db.collection("testimonials").get();
    testimonialsSnapshot.forEach((doc) => {
      testimonials.push(doc);
    });

    const coursesSnapshot = await db
      .collection("courses")
      .orderBy("dateAdded", "desc")
      .limit(1)
      .get();
    coursesSnapshot.forEach((doc) => {
      courses.push(doc);
    });
    const latestCourse = courses[0];
    const modulesSnapshot = await db
      .collection("courses")
      .doc(latestCourse.id)
      .collection("modules")
      .orderBy("moduleOrder")
      .limit(2)
      .get();
    modulesSnapshot.forEach((doc) => {
      modules.push(doc);
    });

    const lecturesSnapshot = await db
      .collectionGroup("lectures")
      .orderBy("lectureOrder")
      .get();
    lecturesSnapshot.forEach((lec) => {
      lectures.push(lec);
    });
    res.render("home", { testimonials, latestCourse, modules, lectures });
  })
);

app.get(
  "/courseModules/:courseID",
  wrapAsync(async (req, res) => {
    const { courseID } = req.params;
    const modules = [],
      lectures = [],
      samples = [];
    const course = await db.collection("courses").doc(courseID).get();
    const modulesSnapshot = await db
      .collection("courses")
      .doc(courseID)
      .collection("modules")
      .orderBy("moduleOrder")
      .get();
    modulesSnapshot.forEach((doc) => {
      modules.push(doc);
    });
    const lecturesSnapshot = await db
      .collectionGroup("lectures")
      .orderBy("lectureOrder")
      .get();
    lecturesSnapshot.forEach((lec) => {
      lectures.push(lec);
    });
    const sampleSnapshot = await db
      .collection("courses")
      .doc(courseID)
      .collection("sampleVideos")
      .orderBy("sampleOrder")
      .get();
    sampleSnapshot.forEach((sample) => {
      samples.push(sample);
    });
    res.render("courseModules", { course, modules, lectures, samples });
  })
);

app.get(
  "/coursePage/:courseID/:uid",
  wrapAsync(async (req, res) => {
    const { uid, courseID } = req.params;
    const modules = [],
      lectures = [],
      studLectures = [],
      studTests = [];
    const courseRef = db.collection("courses").doc(courseID);
    const studCourseRef = db
      .collection("students")
      .doc(uid)
      .collection("courses")
      .doc(courseID);
    const course = await courseRef.get();
    const moduleSnapshot = await courseRef
      .collection("modules")
      .orderBy("moduleOrder")
      .get();
    moduleSnapshot.forEach((module) => {
      modules.push(module);
    });
    const lecturesSnapshot = await db
      .collectionGroup("lectures")
      .orderBy("lectureOrder")
      .get();
    lecturesSnapshot.forEach((lec) => {
      lectures.push(lec);
    });

    const studLectureSnapshot = await studCourseRef
      .collection("studentLectures")
      .get();
    studLectureSnapshot.forEach((lec) => {
      studLectures.push(lec);
    });
    const studTestSnapshot = await studCourseRef
      .collection("studentTests")
      .get();
    studTestSnapshot.forEach((lec) => {
      studTests.push(lec);
    });

    studentCourse = await studCourseRef.get();
    // course.percentCompleted = studentCourse.data().percentCompleted

    const currentLectureID = studentCourse.data().currentLectureID;
    const percentCompleted = studentCourse.data().percentCompleted;
    res.render("coursePage", {
      uid,
      course,
      modules,
      lectures,
      studLectures,
      studTests,
      currentLectureID,
      percentCompleted,
    });
  })
);

app.post(
  "/updateCurrLec/:uid/:courseID/:lectureID",
  wrapAsync(async (req, res) => {
    const { courseID, uid, lectureID } = req.params;

    const courseRef = db
      .collection("students")
      .doc(uid)
      .collection("courses")
      .doc(courseID);

    await courseRef.update({
      currentLectureID: lectureID,
    });
    res.send("done");
  })
);

app.post(
  "/completedLec/:uid/:courseID/:lectureID",
  wrapAsync(async (req, res) => {
    const { courseID, uid, lectureID } = req.params;
    const { nextLecID } = req.body;
    var completedLecs = 0,
      totalLecs = 0;

    const courseRef = db
      .collection("students")
      .doc(uid)
      .collection("courses")
      .doc(courseID);
    const studentLecRef = courseRef.collection("studentLectures");
    await studentLecRef.doc(lectureID).update({
      isCompleted: true,
    });
    const studentLecSnapshot = await studentLecRef.get();
    studentLecSnapshot.forEach((studentLec) => {
      totalLecs++;
      if (studentLec.data().isCompleted) completedLecs++;
    });
    await courseRef.update({
      percentCompleted: parseFloat(
        ((completedLecs / totalLecs) * 100).toFixed(2)
      ),
      currentLectureID: nextLecID,
    });

    res.send("done");
  })
);

app.post(
  "/submitAssignment/:uid/:courseID/:lectureID",
  wrapAsync(async (req, res) => {
    const { courseID, uid, lectureID } = req.params;
    const { submissionLink, nextLecID } = req.body;
    var completedLecs = 0,
      totalLecs = 0;

    console.log(nextLecID, submissionLink);
    const courseRef = db
      .collection("students")
      .doc(uid)
      .collection("courses")
      .doc(courseID);
    const studentLecRef = courseRef.collection("studentLectures");
    const studentTestRef = courseRef.collection("studentTests");

    await studentTestRef.doc(lectureID).set({
      submissionLink: submissionLink,
      courseID: courseID,
      studentID: uid,
      submittedOn: new Date(),
    });

    await studentLecRef.doc(lectureID).update({
      submissionStatus: "submitted",
    });
    const studentLecSnapshot = await studentLecRef.get();
    studentLecSnapshot.forEach((studentLec) => {
      totalLecs++;
      if (studentLec.data().isCompleted) completedLecs++;
    });
    await courseRef.update({
      percentCompleted: parseFloat(
        ((completedLecs / totalLecs) * 100).toFixed(2)
      ),
      currentLectureID: nextLecID,
    });

    res.redirect(`${devFun}/coursePage/${courseID}/${uid}`);
  })
);

app.get(
  "/getCertificate/:uid/:courseID",
  wrapAsync(async (req, res) => {
    const { uid, courseID } = req.params;
    const studentRef = db.collection("students").doc(uid);
    const student = await studentRef.get();
    const course = await db.collection("courses").doc(courseID).get();
    const studCourse = await studentRef
      .collection("courses")
      .doc(courseID)
      .get();
    const percentCompleted = studCourse.data().percentCompleted;
    if (percentCompleted === 100) {
      await transporter.sendMail({
        from: student.data().email, // sender address
        to: "anshpurii@gmail.com", // list of receivers
        subject: "NFA GET CERTIFICATE EMAIL", // Subject line
        html: `Student Name : ${student.data().name}<br>Student Email : ${
          student.data().email
        }<br>Student ID : ${uid}<br> Course Name : ${
          course.data().courseName
        }<br>
                Percent Completed : ${percentCompleted}<br> <h3> Please generate certificate</h3>`, // html body
      });
    }
    res.render("certificatePage");
  })
);

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { email, name, number } = req.body;
  res.render("register2", { email: email, name: name, number: number });
});

app.post(
  "/saveUser",
  wrapAsync(async (req, res) => {
    const { uid, email, name, number } = req.body;
    const data = {
      name: name,
      email: email,
      number: number,
    };

    await db.collection("students").doc(uid).set(data);
    res.redirect(devFun);
  })
);

// app.post('/registerFinal', (req, res) => {
//     res.redirect('/')
// });

app.get("/signIn", (req, res) => {
  res.render("signIn");
});

app.get(
  "/myCourses/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    const courseIDs = [],
      coursesPurchased = [];
    const courseSnapshot = await db
      .collection("students")
      .doc(uid)
      .collection("courses")
      .get();
    courseSnapshot.forEach((course) => {
      courseIDs.push(course.id);
      coursesPurchased.push(course);
    });

    var courses;
    if (courseIDs.length) {
      courses = await db
        .collection("courses")
        .where(admin.firestore.FieldPath.documentId(), "in", courseIDs)
        .get();
      courses.forEach((course) => {
        coursesPurchased.forEach((coursePurchased) => {
          if (coursePurchased.id === course.id)
            course.percentCompleted = coursePurchased.data().percentCompleted;
        });
      });
    }
    res.render("myCourses", { courses, uid });
  })
);

app.get(
  "/internships",
  wrapAsync(async (req, res) => {
    let internships = [];
    const querySnapshot = await db.collection("internships").get();
    querySnapshot.forEach((doc) => {
      internships.push(doc);
    });
    res.render("internships", { internships });
  })
);

app.get(
  "/jobs",
  wrapAsync(async (req, res) => {
    let jobs = [];
    const querySnapshot = await db.collection("jobs").get();
    querySnapshot.forEach((doc) => {
      jobs.push(doc);
    });
    res.render("jobs", { jobs });
  })
);

app.get("/getInTouch", (req, res) => {
  res.render("getInTouch");
});

app.post(
  "/getInTouch",
  wrapAsync(async (req, res) => {
    // cors(req, res, async () => {
    const { name, email, message } = req.body;

    await transporter.sendMail({
      from: email, // sender address
      to: "anshpurii@gmail.com", // list of receivers
      subject: "NFA GET IN TOUCH EMAIL", // Subject line
      html: `SenderName : ${name}<br>SenderEmail : ${email}<br>Message : ${message}<br> `, // html body
    });
    res.render("messageSent");
    // });
  })
);

app.get("/about", (req, res) => {
  res.render("about");
});
app.get("/navin", (req, res) => {
  res.render("navin");
});
app.get(
  "/profile/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    const userRef = db.collection("students").doc(uid);
    const user = await userRef.get();
    if (!user.exists) {
      const message =
        "User does not exist in the database. Try registering again.";
      res.status(500).render("error", { message });
    } else {
      res.render("editProfile", { user: user.data(), uid });
    }
  })
);
app.post(
  "/profile/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    const { name, email, number } = req.body;
    console.log(req.body);
    const userRef = db.collection("students").doc(uid);
    const user = await userRef.get();
    if (!user.exists) {
      const message =
        "User does not exist in the database. Try registering again.";
      res.status(500).render("error", { message });
    } else {
      const data = {
        name: name,
        email: email,
        number: number,
      };
      await db.collection("students").doc(uid).set(data);
      res.render("editProfile", { user: data, uid });
    }
  })
);
app.get("/editProfilePic/:uid", (req, res) => {
  const uid = req.params.uid;
  res.render("editProfilePic", { uid: uid });
});

app.post(
  "/cart",
  wrapAsync(async (req, res) => {
    const { uid, courseID } = req.body;
    // const data = {
    //   dateAdded : new Date()
    // }
    // await db.collection("students").doc(uid).collection('cart').doc(courseID).set(data);
    const data = {
      courseID: courseID,
      dateAdded: new Date(),
    };
    await db.collection("students").doc(uid).update({ cartItem: data });
    res.redirect(`${devFun}/cart/${uid}`);
  })
);

app.get(
  "/cart/:uid",
  wrapAsync(async (req, res) => {
    const { uid } = req.params;
    var course;
    // const cartCourseIDs = []
    // const cartItemSnapshot = await db.collection("students").doc(uid).collection('cart').get()
    // cartItemSnapshot.forEach(async(course) => {
    //   cartCourseIDs.push(course.id)
    // });
    // const coursesInCart = await db.collection("courses").where(admin.firestore.FieldPath.documentId(), 'in', cartCourseIDs).get();
    // res.render("cart", {coursesInCart, uid});
    const student = await db.collection("students").doc(uid).get();
    if (!student.data().cartItem) {
      course = null;
    } else {
      course = await db
        .collection("courses")
        .doc(student.data().cartItem.courseID)
        .get();
    }
    res.render("cart", { course, uid });
  })
);

app.get(
  "/removeFromCart/:uid/:courseID",
  wrapAsync(async (req, res) => {
    const { uid, courseID } = req.params;
    await db.collection("students").doc(uid).update({ cartItem: null });
    res.redirect(`${devFun}/cart/${uid}`);
  })
);

app.post(
  "/create/orderId/:uid",
  wrapAsync(async (req, res) => {
    const amount = req.body.amount;
    const uid = req.params.uid;

    var options = {
      amount: amount, // amount in the smallest currency unit
      currency: "INR",
    };

    instance.orders.create(options, async function (err, order) {
      if (order) {
        const student = await db.collection("students").doc(uid).get();
        // courseIDs.forEach(courseID => {
        // await db.collection("students").doc(uid).collection('cart').doc(courseID).update({orderID:order.orderId})
        // });
        res.send({ order, student: student.data() });
      } else if (err) res.send(err);
    });
  })
);

app.post(
  "/verify/orderId/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;

    let body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
    var expectedSignature = crypto
      .createHmac("sha256", razorpaySecretKey)
      .update(body.toString())
      .digest("hex");
    const student = await db.collection("students").doc(uid).get();
    if (expectedSignature === req.body.razorpay_signature) {
      const allLecIDs = [];

      const moduleSnapshot = await db
        .collection(`courses/${student.data().cartItem.courseID}/modules`)
        .orderBy("moduleOrder")
        .get();
      const allLectures = await db
        .collectionGroup("lectures")
        .orderBy("lectureOrder")
        .get();
      moduleSnapshot.forEach((module) => {
        allLectures.forEach((lec) => {
          if (module.id === lec.data().moduleID) {
            allLecIDs.push(lec.id);
          }
        });
      });

      await db
        .collection("students")
        .doc(uid)
        .collection("courses")
        .doc(student.data().cartItem.courseID)
        .set({
          datePurchased: new Date(),
          percentCompleted: 0,
          currentLectureID: allLecIDs[0],
          paymentID: req.body.razorpay_payment_id,
          orderID: req.body.razorpay_order_id,
        });
      const batch = db.batch();
      const lecRef = db
        .collection("students")
        .doc(uid)
        .collection("courses")
        .doc(student.data().cartItem.courseID)
        .collection("studentLectures");
      const allModules = await db
        .collection("courses")
        .doc(student.data().cartItem.courseID)
        .collection("modules")
        .get();
      const moduleIDs = [];
      allModules.forEach((module) => {
        moduleIDs.push(module.id);
      });
      allLectures.forEach((lecture) => {
        if (moduleIDs.includes(lecture.data().moduleID)) {
          batch.set(lecRef.doc(lecture.id), {
            isCompleted: false,
            moduleID: lecture.data().moduleID,
          });
        }
      });
      batch.set(
        db
          .collection("courses")
          .doc(student.data().cartItem.courseID)
          .collection("students")
          .doc(uid),
        {
          datePurchased: new Date(),
        }
      );

      await batch.commit();
      await db.collection("students").doc(uid).update({ cartItem: null });
      res.redirect(`${devFun}/myCourses/${uid}`);
    } else
      res.render("error", {
        message:
          "Payment not verified. If the amount is debited, it will be refunded in 5-7 days",
      });
  })
);

app.get("/signOut", (req, res) => {
  res.render("signOut");
});
app.get("/faq", (req, res) => {
  res.render("faq");
});

app.get("/admin", (req, res) => {
  res.render("adminSignIn");
});

app.get("/adminConsole/:uid", (req, res) => {
  const uid = req.params.uid;
  admin
    .auth()
    .getUser(uid)
    .then((userRecord) => {
      // The claims can be accessed on the user record.
      if (userRecord.customClaims["admin"])
        res.render("adminConsole", { userRecord });
      else res.render("adminRegister");
    })
    .catch((error) => {
      console.log("Error fetching user data:", error);
      res.status(501).render("error", { error });
    });
});

app.get("/adminRegister", (req, res) => {
  res.render("adminRegister");
});

app.post("/adminRegister", (req, res) => {
  const { email, number, name, adminCode } = req.body;
  res.render("adminRegister2", { email, number, name, adminCode });
});

app.post("/adminRegisterFinal", (req, res) => {
  const { email, pwd, number, name, adminCode } = req.body;
  console.log(adminCode);
  admin
    .auth(adminApp)
    .createUser({
      email: email,
      emailVerified: false,
      password: pwd,
      displayName: name,
      disabled: false,
    })
    .then((userRecord) => {
      // See the UserRecord reference doc for the contents of userRecord.
      admin
        .auth()
        .setCustomUserClaims(userRecord.uid, { admin: true })
        .then(() => {
          // res.redirect(`${devFun}/admin`);
          res.render("adminSignIn", { email, pwd });
        });
    })
    .catch((error) => {
      console.log("Error creating new user:", error);
      res.status(501).render("error", { error });
    });
});

app.get(
  "/adminTestimonials/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    let testimonials = [];
    const querySnapshot = await db.collection("testimonials").get();
    querySnapshot.forEach((doc) => {
      testimonials.push(doc);
    });
    res.render("adminTestimonials", { uid, testimonials });
  })
);

app.get("/adminNewTestimonial/:uid", (req, res) => {
  const uid = req.params.uid;
  res.render("adminNewTestimonial", { uid });
});
app.post(
  "/adminNewTestimonial/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    const { imageURL, name, testimonial, imageID } = req.body;
    const data = {
      imageURL: imageURL,
      testimonial: testimonial,
      name: name,
      imageID: imageID,
    };
    await db.collection("testimonials").doc().set(data);
    res.redirect(devFun + "/adminTestimonials/" + uid);
  })
);
app.get(
  "/adminEditTestimonial/:uid/:tid",
  wrapAsync(async (req, res) => {
    const { uid, tid } = req.params;
    const testiRef = db.collection("testimonials").doc(tid);
    const testimonial = await testiRef.get();
    if (testimonial != null) {
      res.render("adminEditTestimonial", {
        uid,
        testimonial: testimonial,
      });
    } else {
      res.status(404).render("error", { message: "Testimonial not found :(" });
    }
  })
);

app.put(
  "/adminEditTestimonial/:uid/:tid",
  wrapAsync(async (req, res) => {
    const { uid, tid } = req.params;
    const { imageURL, name, testimonial, imageID } = req.body;
    const data = {
      imageURL: imageURL,
      testimonial: testimonial,
      name: name,
      imageID: imageID,
    };
    await db.collection("testimonials").doc(tid).set(data);
    res.redirect(devFun + "/adminTestimonials/" + uid);
  })
);

app.delete(
  "/adminDeleteTestimonial/:uid/:tid",
  wrapAsync(async (req, res) => {
    const { uid, tid } = req.params;
    await db.collection("testimonials").doc(tid).delete();
    res.redirect(devFun + "/adminTestimonials/" + uid);
  })
);

app.get(
  "/adminJobs/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    let jobs = [];
    const querySnapshot = await db.collection("jobs").get();
    querySnapshot.forEach((doc) => {
      jobs.push(doc);
    });
    res.render("adminJobs", { uid, jobs });
  })
);
app.get("/adminNewJob/:uid", (req, res) => {
  const uid = req.params.uid;
  res.render("adminNewJob", { uid });
});
app.post(
  "/adminNewJob/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    const { jobRole, jobExperience, jobCity, jobCountry } = req.body;
    const currentTime = new Date();
    const data = {
      jobRole: jobRole,
      jobExperience: jobExperience,
      jobCity: jobCity,
      jobCountry: jobCountry,
      postTime: currentTime,
    };
    await db.collection("jobs").doc().set(data);
    res.redirect(devFun + "/adminJobs/" + uid);
  })
);
app.get(
  "/adminEditJob/:uid/:jobId",
  wrapAsync(async (req, res) => {
    const { uid, jobId } = req.params;
    const jobRef = db.collection("jobs").doc(jobId);
    const job = await jobRef.get();
    if (job != null) {
      res.render("adminEditJob", {
        uid,
        job: job,
      });
    } else {
      res.status(404).render("error", { message: "Job not found :(" });
    }
  })
);
app.put(
  "/adminEditJob/:uid/:jobID",
  wrapAsync(async (req, res) => {
    const { uid, jobID } = req.params;
    const { jobRole, jobExperience, jobCity, jobCountry } = req.body;
    const data = {
      jobRole: jobRole,
      jobExperience: jobExperience,
      jobCity: jobCity,
      jobCountry: jobCountry,
      postTime: new Date(),
    };
    await db.collection("jobs").doc(jobID).set(data);
    res.redirect(devFun + "/adminJobs/" + uid);
  })
);

app.delete(
  "/adminDeleteJob/:uid/:jobID",
  wrapAsync(async (req, res) => {
    const { uid, jobID } = req.params;
    await db.collection("jobs").doc(jobID).delete();
    res.redirect(devFun + "/adminJobs/" + uid);
  })
);

app.get(
  "/adminInternships/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    let internships = [];
    const querySnapshot = await db.collection("internships").get();
    querySnapshot.forEach((doc) => {
      internships.push(doc);
    });
    res.render("adminInternships", { uid, internships });
  })
);

app.get("/adminNewInternship/:uid", (req, res) => {
  const uid = req.params.uid;
  res.render("adminNewInternship", { uid });
});
app.post(
  "/adminNewInternship/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    const {
      internshipRole,
      internshipDuration,
      internshipCity,
      internshipCountry,
    } = req.body;
    const currentTime = new Date();
    const data = {
      internshipRole: internshipRole,
      internshipDuration: internshipDuration,
      internshipCity: internshipCity,
      internshipCountry: internshipCountry,
      postTime: currentTime,
    };
    await db.collection("internships").doc().set(data);
    res.redirect(devFun + "/adminInternships/" + uid);
  })
);

app.get(
  "/adminEditInternship/:uid/:internshipId",
  wrapAsync(async (req, res) => {
    const { uid, internshipId } = req.params;
    const internshipRef = db.collection("internships").doc(internshipId);
    const internship = await internshipRef.get();
    if (internship != null) {
      res.render("adminEditInternship", {
        uid,
        internship: internship,
      });
    } else {
      res.status(404).render("error", { message: "Internship not found :(" });
    }
  })
);
app.put(
  "/adminEditInternship/:uid/:internshipID",
  wrapAsync(async (req, res) => {
    const { uid, internshipID } = req.params;
    const {
      internshipRole,
      internshipDuration,
      internshipCity,
      internshipCountry,
    } = req.body;
    const data = {
      internshipRole: internshipRole,
      internshipDuration: internshipDuration,
      internshipCity: internshipCity,
      internshipCountry: internshipCountry,
      postTime: new Date(),
    };
    await db.collection("internships").doc(internshipID).set(data);
    res.redirect(devFun + "/adminInternships/" + uid);
  })
);

app.delete(
  "/adminDeleteInternship/:uid/:internshipID",
  wrapAsync(async (req, res) => {
    const { uid, internshipID } = req.params;
    await db.collection("internships").doc(internshipID).delete();
    res.redirect(devFun + "/adminInternships/" + uid);
  })
);

app.get(
  "/adminAllStudents/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    const students = [];
    const querySnapshot = await db.collection("students").get();
    querySnapshot.forEach((student) => {
      students.push(student);
    });

    res.render("adminAllStudents", { uid, students });
  })
);
app.get(
  "/adminStudent/:uid/:studentID",
  wrapAsync(async (req, res) => {
    const { uid, studentID } = req.params;
    const studentCourses = [],
      allCourses = [];
    const studentCoursesSnapshot = await db
      .collection("students")
      .doc(studentID)
      .collection("courses")
      .get();
    const student = await db.collection("students").doc(studentID).get();

    const coursesSnapshot = await db.collection("courses").get();
    coursesSnapshot.forEach((course) => {
      allCourses.push(course);
    });

    const allTests = await db
      .collectionGroup("lectures")
      .where("isTest", "==", true)
      .get();
    const allStudentTests = await db
      .collectionGroup("studentTests")
      .orderBy("submittedOn")
      .get();
    const studTests = [];

    studentCoursesSnapshot.forEach((studCourse) => {
      allCourses.forEach((allCourse) => {
        if (studCourse.id === allCourse.id) {
          studCourse.name = allCourse.data().courseName;
        }
      });

      studentCourses.push(studCourse);
    });

    allStudentTests.forEach((test) => {
      if (test.data().studentID === studentID) {
        const newTest = {};
        allTests.forEach((allTest) => {
          if (test.id === allTest.id) {
            test.name = allTest.data().lectureName;
          }
        });
        studTests.push(test);
      }
    });

    res.render("adminStudentDetails", {
      uid,
      studentCourses,
      studTests,
      student,
    });
  })
);

app.post(
  "/testFeedback/:uid/:courseID/:testID/:studentID",
  wrapAsync(async (req, res) => {
    const { uid, courseID, testID, studentID } = req.params;
    const { feedback, grade } = req.body;

    const courseRef = db
      .collection("students")
      .doc(studentID)
      .collection("courses")
      .doc(courseID);
    const testRef = courseRef.collection("studentTests").doc(testID);
    const lecRef = courseRef.collection("studentLectures").doc(testID);

    var completedLecs = 0,
      totalLecs = 0;
    const studentLecRef = courseRef.collection("studentLectures");

    await testRef.update({
      feedback: feedback,
      grade: grade,
    });

    await lecRef.update({
      submissionStatus: "graded",
      isCompleted: true,
    });

    const studentLecSnapshot = await studentLecRef.get();
    studentLecSnapshot.forEach((studentLec) => {
      totalLecs++;
      if (studentLec.data().isCompleted) completedLecs++;
    });

    await courseRef.update({
      percentCompleted: parseFloat(
        ((completedLecs / totalLecs) * 100).toFixed(2)
      ),
    });

    res.redirect(`${devFun}/adminStudent/${uid}/${studentID}`);
  })
);

app.get(
  "/adminAllCourses/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    const courses = [];
    const querySnapshot = await db.collection("courses").get();
    querySnapshot.forEach((doc) => {
      courses.push(doc);
    });
    res.render("adminAllCourses", { uid, courses });
  })
);
app.get("/adminNewCourse/:uid", (req, res) => {
  const uid = req.params.uid;
  res.render("adminNewCourse", { uid });
});

app.post(
  "/adminNewCourse/:uid/",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    const {
      courseName,
      instructorName,
      courseLanguage,
      previewLink,
      bestsellerTag = null,
      beginnerTag = null,
      intermediateTag = null,
      courseDescription,
      thumbnailURL,
      thumbnailID,
      courseID,
      coursePrice,
      discountAmount,
    } = req.body;

    const data = {
      courseName: courseName,
      instructorName: instructorName,
      courseLanguage: courseLanguage,
      previewLink: previewLink,
      bestsellerTag: bestsellerTag,
      beginnerTag: beginnerTag,
      intermediateTag: intermediateTag,
      courseDescription: courseDescription,
      thumbnailURL: thumbnailURL,
      thumbnailID: thumbnailID,
      numModules: 0,
      numLectures: 0,
      duration: 0,
      coursePrice: coursePrice,
      discountAmount: discountAmount,
      dateAdded: new Date(),
    };

    await db.collection("courses").doc(courseID).set(data);
    res.redirect(devFun + "/adminAllCourses/" + uid);
  })
);

app.get(
  "/adminEditCourse/:uid/:courseID",
  wrapAsync(async (req, res) => {
    const { uid, courseID } = req.params;
    const courseRef = db.collection("courses").doc(courseID);
    const course = await courseRef.get();
    if (course != null) {
      res.render("adminEditCourse", { uid, course });
    } else {
      res.status(404).render("error", { message: "Course not found :(" });
    }
  })
);

app.put(
  "/adminEditCourse/:uid",
  wrapAsync(async (req, res) => {
    const uid = req.params.uid;
    const {
      courseName,
      instructorName,
      courseLanguage,
      previewLink,
      bestsellerTag = null,
      beginnerTag = null,
      intermediateTag = null,
      courseDescription,
      thumbnailURL,
      thumbnailID,
      coursePrice,
      discountAmount,
      courseID,
    } = req.body;

    const data = {
      courseName: courseName,
      instructorName: instructorName,
      courseLanguage: courseLanguage,
      previewLink: previewLink,
      bestsellerTag: bestsellerTag,
      beginnerTag: beginnerTag,
      intermediateTag: intermediateTag,
      courseDescription: courseDescription,
      thumbnailURL: thumbnailURL,
      thumbnailID: thumbnailID,
      coursePrice: coursePrice,
      discountAmount: discountAmount,
    };

    await db.collection("courses").doc(courseID).update(data);
    res.redirect(devFun + "/adminAllCourses/" + uid);
  })
);

app.delete(
  "/adminDeleteCourse/:uid/:courseID",
  wrapAsync(async (req, res) => {
    const { uid, courseID } = req.params;
    await db.collection("courses").doc(courseID).delete();
    res.redirect(devFun + "/adminAllCourses/" + uid);
  })
);

app.get(
  "/adminAllModules/:uid/:courseID",
  wrapAsync(async (req, res) => {
    const { uid, courseID } = req.params;
    const courseRef = db.collection("courses").doc(courseID);
    const course = await courseRef.get();
    const modulesSnapshot = await courseRef
      .collection("modules")
      .orderBy("moduleOrder")
      .get();
    const modules = [];
    const lectures = [];

    //  modulesSnapshot.forEach(async (module) => {
    //   const lectures = []
    //   const lecturesSnapshot = await courseRef.collection("modules").doc(module.id).collection('lectures').get()

    //   lecturesSnapshot.forEach(lec => {
    //     lectures.push(lec)
    //     console.log(lec.data())
    //   });

    //   modules.push({lectures, module})
    //   console.log(module.data())

    // });

    modulesSnapshot.forEach(async (module) => {
      modules.push(module);
    });

    const lecturesSnapshot = await db
      .collectionGroup("lectures")
      .orderBy("lectureOrder")
      .get();
    lecturesSnapshot.forEach((lec) => {
      lectures.push(lec);
    });

    res.render("adminAllModules", { uid, course, modules, lectures });
  })
);

app.get("/adminAddModule/:uid/:courseID/:prevOrder", (req, res) => {
  const { uid, courseID, prevOrder } = req.params;
  res.render("adminNewModule", { uid, courseID, prevOrder });
});

app.post(
  "/adminAddModule/:uid/:courseID/:moduleOrder",
  wrapAsync(async (req, res) => {
    const { uid, courseID, moduleOrder } = req.params;
    const {
      moduleName,
      moduleDescription,
      thumbnailID,
      thumbnailURL,
      moduleID,
    } = req.body;

    const data = {
      moduleName: moduleName,
      moduleDescription: moduleDescription,
      thumbnailID: thumbnailID,
      thumbnailURL: thumbnailURL,
      moduleOrder: parseInt(moduleOrder),
      duration: 0,
      numLectures: 0,
    };
    const courseRef = db.collection("courses").doc(courseID);
    const highestModule = await courseRef
      .collection("modules")
      .orderBy("moduleOrder", "desc")
      .limit(1)
      .get();
    let maxOrder;
    highestModule.forEach(async (module) => {
      maxOrder = module.data().moduleOrder;
    });

    if (moduleOrder <= maxOrder) {
      const querySnapshot = await courseRef
        .collection("modules")
        .where("moduleOrder", ">=", parseInt(moduleOrder))
        .get();
      querySnapshot.forEach(async (module) => {
        await courseRef
          .collection("modules")
          .doc(module.id)
          .update({ moduleOrder: module.data().moduleOrder + 1 });
      });
    }
    const course = await courseRef.get();
    const prevNumModules = course.data().numModules;
    await courseRef.collection("modules").doc(moduleID).set(data);
    await courseRef.update({ numModules: prevNumModules + 1 });
    res.redirect(devFun + "/adminAllModules/" + uid + "/" + courseID);
  })
);

app.get(
  "/adminEditModule/:uid/:courseID/:moduleID",
  wrapAsync(async (req, res) => {
    const { uid, courseID, moduleID } = req.params;
    const module = await db
      .collection("courses")
      .doc(courseID)
      .collection("modules")
      .doc(moduleID)
      .get();
    res.render("adminEditModule", { uid, courseID, module });
  })
);

app.put(
  "/adminEditModule/:uid/:courseID/:moduleID",
  wrapAsync(async (req, res) => {
    const { uid, courseID } = req.params;
    const {
      moduleName,
      moduleDescription,
      thumbnailID,
      thumbnailURL,
      moduleID,
    } = req.body;

    const data = {
      moduleName: moduleName,
      moduleDescription: moduleDescription,
      thumbnailID: thumbnailID,
      thumbnailURL: thumbnailURL,
    };
    await db
      .collection("courses")
      .doc(courseID)
      .collection("modules")
      .doc(moduleID)
      .update(data);
    res.redirect(devFun + "/adminAllModules/" + uid + "/" + courseID);
  })
);

app.delete(
  "/adminDeleteModule/:uid/:courseID/:moduleID",
  wrapAsync(async (req, res) => {
    const { uid, courseID, moduleID } = req.params;
    const courseRef = db.collection("courses").doc(courseID);
    const moduleRef = courseRef.collection("modules").doc(moduleID);

    const course = await courseRef.get();
    const prevNumModules = course.data().numModules;

    await courseRef.update({ numModules: prevNumModules - 1 });
    const module = await moduleRef.get();

    const highestModule = await courseRef
      .collection("modules")
      .orderBy("moduleOrder", "desc")
      .limit(1)
      .get();
    let maxOrder;
    highestModule.forEach(async (module) => {
      maxOrder = module.data().moduleOrder;
    });

    if (module.data().moduleOrder < maxOrder) {
      const querySnapshot = await courseRef
        .collection("modules")
        .where("moduleOrder", ">", module.data().moduleOrder)
        .get();
      querySnapshot.forEach(async (module) => {
        await courseRef
          .collection("modules")
          .doc(module.id)
          .update({ moduleOrder: module.data().moduleOrder - 1 });
      });
    }

    await moduleRef.delete();
    res.redirect(devFun + "/adminAllModules/" + uid + "/" + courseID);
  })
);

app.get(
  "/adminAddLecture/:uid/:courseID/:moduleID/:prevLecOrder",
  (req, res) => {
    const { uid, courseID, moduleID, prevLecOrder } = req.params;
    res.render("adminNewLecture", { uid, courseID, moduleID, prevLecOrder });
  }
);

app.post(
  "/adminAddLecture/:uid/:courseID/:moduleID/:lectureOrder",
  wrapAsync(async (req, res, next) => {
    const { uid, courseID, moduleID, lectureOrder } = req.params;
    const { lectureName, lectureDescription, lecVidURL } = req.body;
    // const duration = await getVideoDurationInSeconds(lecVidURL)
    // console.log(duration)

    const vimeoID = lecVidURL.split("https://vimeo.com/")[1];
    var duration = 0,
      embedURL = "";

    client.request(
      {
        method: "GET",
        path: "/videos/" + vimeoID,
      },
      async function (error, body, status_code, headers) {
        try {
          if (error) {
            throw new Error("Invalid video, cannot find duration");
          }

          duration = parseFloat(body.duration.toFixed(2));

          const data = {
            moduleID: moduleID,
            lectureName: lectureName,
            lectureDescription: lectureDescription,
            lecVidURL: lecVidURL,
            lectureOrder: parseInt(lectureOrder),
            duration: duration,
          };

          const courseRef = db.collection("courses").doc(courseID);
          const moduleRef = courseRef.collection("modules").doc(moduleID);
          const batch = db.batch();

          const highestLecture = await moduleRef
            .collection("lectures")
            .orderBy("lectureOrder", "desc")
            .limit(1)
            .get();

          let maxOrder;
          highestLecture.forEach(async (lecture) => {
            maxOrder = lecture.data().lectureOrder;
          });

          if (lectureOrder < maxOrder) {
            const querySnapshot = await moduleRef
              .collection("lectures")
              .where("lectureOrder", ">", parseInt(lectureOrder))
              .get();
            querySnapshot.forEach(async (lecture) => {
              // await  moduleRef.collection("lectures").doc(lecture.id).update({lectureOrder : lecture.data().lectureOrder+1})
              batch.update(moduleRef.collection("lectures").doc(lecture.id), {
                lectureOrder: lecture.data().lectureOrder + 1,
              });
            });
          }

          const module = await moduleRef.get();
          const prevNumLectures = module.data().numLectures;
          const prevModuleDuration = module.data().duration;
          // await moduleRef.update({
          //   numLectures: prevNumLectures+1,
          //   duration : parseFloat(duration.toFixed(2))+prevModuleDuration
          // })
          batch.update(moduleRef, {
            numLectures: prevNumLectures + 1,
            duration: parseFloat(duration.toFixed(2)) + prevModuleDuration,
          });

          const course = await courseRef.get();
          const prevLecsCourse = course.data().numLectures;
          const prevCourseDuration = course.data().duration;
          // await courseRef.update({
          //   numLectures: prevLecsCourse+1,
          //   duration : parseFloat(duration.toFixed(2))+prevCourseDuration
          // })

          batch.update(courseRef, {
            numLectures: prevLecsCourse + 1,
            duration: parseFloat(duration.toFixed(2)) + prevCourseDuration,
          });

          // const newlecture = await moduleRef.collection("lectures").add(data)
          const newlecture = await moduleRef.collection("lectures").doc();
          batch.set(newlecture, data);

          const studentSnapshot = await courseRef.collection("students").get();

          studentSnapshot.forEach((student) => {
            batch.set(
              db
                .collection("students")
                .doc(student.id)
                .collection("courses")
                .doc(courseID)
                .collection("studentLectures")
                .doc(newlecture.id),
              {
                isCompleted: false,
                moduleID: moduleID,
              }
            );
          });
          await batch.commit();

          res.redirect(devFun + "/adminAllModules/" + uid + "/" + courseID);
        } catch (error) {
          next(error);
        }
      }
    );
  })
);

app.get(
  "/adminEditLecture/:uid/:courseID/:moduleID/:lectureID",
  wrapAsync(async (req, res) => {
    const { uid, courseID, moduleID, lectureID } = req.params;
    const lecture = await db
      .collection("courses")
      .doc(courseID)
      .collection("modules")
      .doc(moduleID)
      .collection("lectures")
      .doc(lectureID)
      .get();
    if (lecture.data().isTest)
      res.render("adminEditTest", { uid, courseID, moduleID, lecture });
    else res.render("adminEditLecture", { uid, courseID, moduleID, lecture });
  })
);

app.put(
  "/adminEditLecture/:uid/:courseID/:moduleID/:lectureID",
  wrapAsync(async (req, res) => {
    const { uid, courseID, moduleID, lectureID } = req.params;
    const { lectureName, lectureDescription, lecVidURL, prevDuration } =
      req.body;
    const vimeoID = lecVidURL.split("https://vimeo.com/")[1];
    var duration = 0,
      embedURL = "";

    client.request(
      {
        method: "GET",
        path: "/videos/" + vimeoID,
      },
      async function (error, body, status_code, headers) {
        if (error) {
          console.log(error);
          return next(new Error("Video link is broken!"));
        }

        duration = parseFloat(body.duration.toFixed(2));

        const data = {
          lectureName: lectureName,
          lectureDescription: lectureDescription,
          lecVidURL: lecVidURL,
          duration: duration,
        };

        const courseRef = db.collection("courses").doc(courseID);
        const moduleRef = courseRef.collection("modules").doc(moduleID);

        const module = await moduleRef.get();
        const prevModuleDuration = module.data().duration;
        await moduleRef.update({
          duration:
            parseFloat(duration.toFixed(2)) +
            (prevModuleDuration - prevDuration),
        });

        const course = await courseRef.get();
        const prevCourseDuration = course.data().duration;
        await courseRef.update({
          duration:
            parseFloat(duration.toFixed(2)) +
            (prevCourseDuration - prevDuration),
        });
        await db
          .collection("courses")
          .doc(courseID)
          .collection("modules")
          .doc(moduleID)
          .collection("lectures")
          .doc(lectureID)
          .update(data);
        res.redirect(devFun + "/adminAllModules/" + uid + "/" + courseID);
      }
    );
  })
);

app.delete(
  "/adminDeleteLecture/:uid/:courseID/:moduleID/:lectureID",
  wrapAsync(async (req, res) => {
    const { uid, courseID, moduleID, lectureID } = req.params;

    const courseRef = db.collection("courses").doc(courseID);
    const moduleRef = courseRef.collection("modules").doc(moduleID);
    const lecRef = moduleRef.collection("lectures").doc(lectureID);

    const lecture = await lecRef.get();
    const duration = lecture.data().duration;

    const module = await moduleRef.get();
    const prevModuleLectures = module.data().numLectures;
    const prevModuleDuration = module.data().duration;
    await moduleRef.update({
      numLectures: prevModuleLectures - 1,
    });

    const course = await courseRef.get();
    const prevCourseLectures = course.data().numLectures;
    const prevCourseDuration = course.data().duration;
    await courseRef.update({
      numLectures: prevCourseLectures - 1,
    });

    if (!lecture.data().isTest) {
      await courseRef.update({
        duration: prevCourseDuration - duration,
      });
      await moduleRef.update({
        duration: prevModuleDuration - duration,
      });
    }

    const highestLecture = await moduleRef
      .collection("lectures")
      .orderBy("lectureOrder", "desc")
      .limit(1)
      .get();
    let maxOrder;
    highestLecture.forEach(async (lecture) => {
      maxOrder = lecture.data().lectureOrder;
    });

    if (lecture.data().lectureOrder < maxOrder) {
      const querySnapshot = await moduleRef
        .collection("lectures")
        .where("lectureOrder", ">", lecture.data().lectureOrder)
        .get();
      querySnapshot.forEach(async (lecture) => {
        await moduleRef
          .collection("lectures")
          .doc(lecture.id)
          .update({ lectureOrder: lecture.data().lectureOrder - 1 });
      });
    }

    await lecRef.delete();
    const studentSnapshot = await db
      .collection("courses")
      .doc(courseID)
      .collection("students")
      .get();
    const batch = db.batch();
    studentSnapshot.forEach((student) => {
      batch.delete(
        db
          .collection("students")
          .doc(student.id)
          .collection("courses")
          .doc(courseID)
          .collection("studentLectures")
          .doc(lectureID)
      );
    });
    await batch.commit();

    res.redirect(devFun + "/adminAllModules/" + uid + "/" + courseID);
  })
);

app.get("/adminAddTest/:uid/:courseID/:moduleID/:prevLecOrder", (req, res) => {
  const { uid, courseID, moduleID, prevLecOrder } = req.params;
  res.render("adminNewTest", { uid, courseID, moduleID, prevLecOrder });
});

app.post(
  "/adminAddTest/:uid/:courseID/:moduleID/:lectureOrder",
  wrapAsync(async (req, res) => {
    const { uid, courseID, moduleID, lectureOrder } = req.params;
    const { lectureName, testInstructions, testResourceLink } = req.body;

    const data = {
      moduleID: moduleID,
      lectureName: lectureName,
      testInstructions: testInstructions,
      testResourceLink: testResourceLink,
      lectureOrder: parseInt(lectureOrder),
      isTest: true,
    };
    const moduleRef = db
      .collection("courses")
      .doc(courseID)
      .collection("modules")
      .doc(moduleID);
    const highestLecture = await moduleRef
      .collection("lectures")
      .orderBy("lectureOrder", "desc")
      .limit(1)
      .get();
    let maxOrder;
    highestLecture.forEach(async (lecture) => {
      maxOrder = lecture.data().lectureOrder;
    });

    if (lectureOrder <= maxOrder) {
      const querySnapshot = await moduleRef
        .collection("lectures")
        .where("lectureOrder", ">=", parseInt(lectureOrder))
        .get();
      querySnapshot.forEach(async (lecture) => {
        await moduleRef
          .collection("lectures")
          .doc(lecture.id)
          .update({ lectureOrder: lecture.data().lectureOrder + 1 });
      });
    }
    const module = await moduleRef.get();
    const prevNumLectures = module.data().numLectures;
    await moduleRef.update({ numLectures: prevNumLectures + 1 });
    const newlecture = await moduleRef.collection("lectures").add(data);

    const course = await db.collection("courses").doc(courseID).get();
    const prevLecsCourse = course.data().numLectures;
    await db
      .collection("courses")
      .doc(courseID)
      .update({
        numLectures: prevLecsCourse + 1,
      });

    const studentSnapshot = await db
      .collection("courses")
      .doc(courseID)
      .collection("students")
      .get();

    const batch = db.batch();
    studentSnapshot.forEach((student) => {
      batch.set(
        db
          .collection("students")
          .doc(student.id)
          .collection("courses")
          .doc(courseID)
          .collection("studentLectures")
          .doc(newlecture.id),
        {
          isCompleted: false,
          moduleID: moduleID,
        }
      );
    });
    await batch.commit();
    res.redirect(devFun + "/adminAllModules/" + uid + "/" + courseID);
  })
);

app.put(
  "/adminEditTest/:uid/:courseID/:moduleID/:lectureID",
  wrapAsync(async (req, res) => {
    const { uid, courseID, moduleID, lectureID } = req.params;
    const { lectureName, testInstructions, testResourceLink } = req.body;

    const data = {
      lectureName: lectureName,
      testInstructions: testInstructions,
      testResourceLink: testResourceLink,
    };

    await db
      .collection("courses")
      .doc(courseID)
      .collection("modules")
      .doc(moduleID)
      .collection("lectures")
      .doc(lectureID)
      .update(data);
    res.redirect(devFun + "/adminAllModules/" + uid + "/" + courseID);
  })
);

app.get(
  "/adminAllSampleVideos/:uid/:courseID",
  wrapAsync(async (req, res) => {
    const { uid, courseID } = req.params;
    const querySnapshot = await db
      .collection("courses")
      .doc(courseID)
      .collection("sampleVideos")
      .orderBy("sampleOrder")
      .get();
    const sampleVideos = [];
    querySnapshot.forEach((sampleVideo) => {
      sampleVideos.push(sampleVideo);
    });
    res.render("adminAllSampleVideos", { uid, courseID, sampleVideos });
  })
);

app.get("/adminAddSampleVideo/:uid/:courseID/:sampleOrder", (req, res) => {
  const { uid, courseID, sampleOrder } = req.params;
  res.render("adminNewSampleVideo", { uid, courseID, sampleOrder });
});

app.post(
  "/adminAddSampleVideo/:uid/:courseID/:sampleOrder",
  wrapAsync(async (req, res) => {
    const { uid, courseID, sampleOrder } = req.params;
    const {
      sampleName,
      sampleURL,
      sampleDescription,
      thumbnailID,
      thumbnailURL,
      sampleID,
    } = req.body;

    const data = {
      sampleName: sampleName,
      sampleURL: sampleURL,
      sampleDescription: sampleDescription,
      thumbnailID: thumbnailID,
      thumbnailURL: thumbnailURL,
      sampleOrder: parseInt(sampleOrder),
    };

    const sampleVideosRef = db
      .collection("courses")
      .doc(courseID)
      .collection("sampleVideos");
    // const maxOrder = await sampleVideosRef.orderBy("amount", 'desc').limit(1).get().data().sampleOrder;
    const highestSample = await sampleVideosRef
      .orderBy("sampleOrder", "desc")
      .limit(1)
      .get();
    let maxOrder;

    highestSample.forEach(async (sample) => {
      maxOrder = sample.data().sampleOrder;
    });

    if (sampleOrder <= maxOrder) {
      const querySnapshot = await sampleVideosRef
        .where("sampleOrder", ">=", parseInt(sampleOrder))
        .get();
      querySnapshot.forEach(async (sample) => {
        await sampleVideosRef
          .doc(sample.id)
          .update({ sampleOrder: sample.data().sampleOrder + 1 });
      });
    }

    await sampleVideosRef.doc(sampleID).set(data);
    res.redirect(devFun + "/adminAllSampleVideos/" + uid + "/" + courseID);
  })
);

app.get(
  "/adminEditSampleVideo/:uid/:courseID/:sampleID",
  wrapAsync(async (req, res) => {
    const { uid, courseID, sampleID } = req.params;
    const sample = await db
      .collection("courses")
      .doc(courseID)
      .collection("sampleVideos")
      .doc(sampleID)
      .get();
    res.render("adminEditSampleVideo", { uid, courseID, sample });
  })
);

app.put(
  "/adminEditSampleVideo/:uid/:courseID/:sampleID",
  wrapAsync(async (req, res) => {
    const { uid, courseID, sampleID } = req.params;
    const {
      sampleName,
      sampleURL,
      sampleDescription,
      thumbnailID,
      thumbnailURL,
    } = req.body;
    const data = {
      sampleName: sampleName,
      sampleURL: sampleURL,
      sampleDescription: sampleDescription,
      thumbnailID: thumbnailID,
      thumbnailURL: thumbnailURL,
    };
    await db
      .collection("courses")
      .doc(courseID)
      .collection("sampleVideos")
      .doc(sampleID)
      .update(data);
    res.redirect(devFun + "/adminAllSampleVideos/" + uid + "/" + courseID);
  })
);

app.delete(
  "/adminDeleteSampleVideo/:uid/:courseID/:sampleID",
  wrapAsync(async (req, res) => {
    const { uid, courseID, sampleID } = req.params;
    const courseRef = db.collection("courses").doc(courseID);
    const sampleRef = courseRef.collection("sampleVideos").doc(sampleID);
    const sample = await sampleRef.get();

    const highestModule = await courseRef
      .collection("sampleVideos")
      .orderBy("sampleOrder", "desc")
      .limit(1)
      .get();
    let maxOrder;
    highestModule.forEach(async (sample) => {
      maxOrder = sample.data().sampleOrder;
    });

    if (sample.data().sampleOrder < maxOrder) {
      const querySnapshot = await courseRef
        .collection("sampleVideos")
        .where("sampleOrder", ">", sample.data().sampleOrder)
        .get();
      querySnapshot.forEach(async (sample) => {
        await courseRef
          .collection("sampleVideos")
          .doc(sample.id)
          .update({ sampleOrder: sample.data().sampleOrder - 1 });
      });
    }
    await db
      .collection("courses")
      .doc(courseID)
      .collection("sampleVideos")
      .doc(sampleID)
      .delete();
    res.redirect(devFun + "/adminAllSampleVideos/" + uid + "/" + courseID);
  })
);

app.use((err, req, res, next) => {
  console.log(err);
  res.render("error", { message: "Oops! Something went wrong" });
});

app.get("*", (req, res) => {
  const status = 404;
  const message = "Oops! Page not found :(";
  res.status(status).render("error", { message });
});
