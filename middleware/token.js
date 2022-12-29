import jwt from 'jsonwebtoken'
export const generateAccessToken = (email,id,name,time) =>{
    return jwt.sign({
        email:email,
        id:id,
        role:name
        },process.env.TOKEN_KEY,
        { expiresIn: time }
    )
  }
  //export default {generateAccessToken}