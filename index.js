import express from 'express'
var app = express();
import cors from 'cors'
import UserRoute from './routes/user.js'
import CourseRoute from './routes/course.js'
import CourseAttendees from './routes/course-attendees.js'

const PORT = process.env.PORT
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false })); 

app.use('/api/user',UserRoute)
app.use('/course',CourseRoute)
app.use('/course-attendee',CourseAttendees)
app.use('/public/uploads', express.static('public/uploads'))

app.listen(PORT,()=>{
    console.log(`listening to port ${PORT}`);
})