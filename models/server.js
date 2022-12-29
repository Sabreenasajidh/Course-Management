import Sequelize from 'sequelize'
import dotenv from'dotenv/config'

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DIALECT,
    define: {
        timestamps: false
    }
})

sequelize.authenticate().then(()=>{
    console.log('connected to db');
}).catch(err=>{
    console.log('Unable to connect to db',err);
})

const db = {}

db.sequelize = sequelize;
db.Sequelize = Sequelize;


export default sequelize