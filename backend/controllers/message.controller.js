// const User = require("../database/freel.model.js");
// const jobSeeker=require("../model/freelancer.js");
const { jobSeekers } = require("../model/freelancer.js");
// const {JobApplication} = require("../database/application.js");
const {JobApplication} = require("../database/application.js");

const {RecruiterUser} = require("../model/rec");

const Message = require("../database/message.model.js");
const { getRecieverSocketId, io } = require("../lib/socketio.js");

const getusersforsidebars = async (req, res) => {
  try {
    const { uid } = req.params; // recruiterId
    console.log("Fetching applicants for seeker:", uid);

    // Step 1: Get applications for this seeker with status 'accepted'
    const applications = await JobApplication.find({ seekerId: uid, status: "accepted" });
    console.log(applications)
    // If no applications found, return an empty array or appropriate response
    if (!applications.length) {
      return res.status(200).json({ applicants: [] });
    }

    // Step 2: Extract seeker IDs (providerId from JobApplication)
    const recIds = applications.map(app => app.providerId);

    // Step 3: Get full user data for recruiters whose recid is in recIds
    const recIdss = await RecruiterUser.find({ recid: { $in: recIds } });

    res.status(200).json({ applicants: recIdss });
  } catch (error) {
    console.error("Error retrieving applicants:", error);
    res.status(500).json({ error: "Failed to get applicants", details: error.message });
  }
};

const getmessage = async (req, res) => {
  try {
    const { id: senderid, rid: usertochat } = req.params;
    const messages = await Message.find({
      $or: [
        { senderid: senderid, recieverid: usertochat },
        { senderid: usertochat, recieverid: senderid },
      ],
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const sendmessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { sid: senderid, rid: recieverid } = req.params;
    const newmessage = new Message({ senderid, recieverid, text });
    await newmessage.save();

    const recieverSocketId = getRecieverSocketId(recieverid);
    if (recieverSocketId) {
      io.to(recieverSocketId).emit("newMessage", newmessage);
    }

    res.status(201).json(newmessage);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getusersforsidebars,
  getmessage,
  sendmessage
};
