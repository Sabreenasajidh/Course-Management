import Sequelize from 'sequelize'
import sequelize from './server.js'
import User from '../models/User.js'
import Course from './Course.js'

let Course_attendee = sequelize.define('Course_attendee',{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement : true
    },
    user_id:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    course_id:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    attendee_type:{
        type:Sequelize.STRING,
        allowNull:false
    },
    status:{
        type:Sequelize.STRING,
        defaultValue:'active'
    }
},
{ 
    timestamps: true,
},
)

User.hasMany(Course_attendee,{foreignKey:'user_id'})
Course_attendee.belongsTo(User,{
    foreignKey : 'user_id',
    allowNull:false
})

Course.hasMany(Course_attendee,{foreignKey:'course_id'})
Course_attendee.belongsTo(Course,{
    foreignKey : 'course_id',
    allowNull:false
})


export default Course_attendee