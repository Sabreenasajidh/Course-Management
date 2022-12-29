import Sequelize from 'sequelize'
import sequelize from './server.js'
import User from '../models/User.js'
import Course from './Course.js'

let Lesson = sequelize.define('Lesson',{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement : true
    },
    title:{
        type:Sequelize.STRING,
        allowNull:false
    },
    description:{
        type:Sequelize.STRING,
        allowNull:false
    },
    slug : {
        type : Sequelize.STRING,
        allowNull:false,
        unique:true
    },
    course_id:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    status:{
        type:Sequelize.STRING,
        defaultValue:'active'
    },
    created_by:{
        type:Sequelize.INTEGER,
        allowNull:false,
        // references: {
        //     model: 'Users',
        //     key: 'id'
        // }
    }
},
{ 
    timestamps: true,
},
{    
    freezeTableName:true,
    // indexes: [
    //     {
    //         name: 'title',
    //         fields: ['title']
    //     },
    // ]
},
)

User.hasMany(Lesson,{foreignKey:'created_by'})
Lesson.belongsTo(User,{
    foreignKey : 'created_by',
    allowNull:false
})

Course.hasMany(Lesson,{foreignKey:'course_id'})
Lesson.belongsTo(Course,{
    foreignKey : 'course_id',
    allowNull:false
})


export default Lesson