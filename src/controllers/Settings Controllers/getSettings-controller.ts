import { Request, Response } from "express";
import Settings, { SettingsAttribute } from "../../models/settings";
import Users from "../../models/users";
import { JwtPayload } from "jsonwebtoken";


export const getUserSettings = async(req:JwtPayload, res:Response) =>{
    try {
    const user_id = req.user.id 
    const owner_id = user_id
    


    const userGetSettings = await Settings.findOne({where:{owner_id}}) 
    if(!userGetSettings) 
     res.status(400).json({message: "userSetting cannot be found"}) 
    return res.status(200).json({
      message : "Settings fetched succesfully",
        method: req.method ,
        data: userGetSettings 
    })
    } catch (error) {       
    return res.status(500).json({ error: "An error occurred while retrieving user settings" }); 
    }
}