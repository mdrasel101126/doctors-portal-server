const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Doctors Portal Server is Running.....");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3m2j3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const appointmentOptions = client
      .db("DoctorsPortalNew")
      .collection("appointmentOptions");
    const bookingsCollection = client
      .db("DoctorsPortalNew")
      .collection("Bookings");
    //get api
    // get appointmentOptions api
    //use Aggregate to query multiple collection and then merger data
    app.get("/appointmentOptions", async (req, res) => {
      const date = req.query.date;
      //console.log(date);
      const query = {};
      const cursor = appointmentOptions.find(query);
      const options = await cursor.toArray();
      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();
      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.treatmentName === option.name
        );
        const bookedSlots = optionBooked.map((book) => book.slot);
        const remainingSlotts = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        option.slots = remainingSlotts;
      });

      res.send(options);
    });

    //post api
    // post bookings api
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      //console.log(booking);

      const query = {
        appointmentDate: booking.appointmentDate,
        treatmentName: booking.treatmentName,
        email: booking.email,
      };
      const alreadyBooked = await bookingsCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `You already have a booking on ${booking.appointmentDate}`;
        return res.send({ acknowledged: false, message });
      }
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });
  } finally {
    //never closed
  }
}
run().catch((error) => console.log(error));

app.listen(port, () => {
  console.log("Doctors Portal Server Running on Port ", port);
});
