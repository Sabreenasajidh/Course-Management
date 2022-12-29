import Sequelize from 'sequelize'
import sequelize from './server.js'
import Course from './Course.js'

let Quiz = sequelize.define('Quiz',{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement : true
    },
    type:{
        type:Sequelize.STRING,
        allowNull:false
    },
    course_id:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    question:{
        type:Sequelize.STRING,
        allowNull:false
    },
    mark:{
        type:Sequelize.INTEGER,
        allowNull:false
    }
},
{
    timestamps: true,
},
{    
    freezeTableName:true,
},
)
Course.hasMany(Quiz,{foreignKey:'course_id'})
Quiz.belongsTo(Course,{
    foreignKey : 'course_id',
    allowNull:false
})

export default Quiz