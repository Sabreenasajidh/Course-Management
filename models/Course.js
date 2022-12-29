import Sequelize from 'sequelize'
import sequelize from './server.js'
import User from '../models/User.js'

let Course = sequelize.define('Course',{
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
    maximum_attendee:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    bg_image:{
        type:Sequelize.STRING,
        allowNull:true
    },
    thumbnail:{
        type:Sequelize.STRING,
        allowNull:true

    },
    course_start_time:{
        type:Sequelize.DATE,
        allowNull:false
    },
    course_end_time:{
        type:Sequelize.DATE,
        allowNull:false
    },
    status:{
        type:Sequelize.STRING,
        defaultValue:'active'
    },
    created_by:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
},
{ 
    timestamps: true,
  },
{    
    freezeTableName:true,
    indexes: [
        {
            name: 'title',
            fields: ['title']
        },
    ]
},
)

User.hasMany(Course,{foreignKey:'created_by'})
Course.belongsTo(User,{
    foreignKey : 'created_by',
    allowNull:false
})


export default Course