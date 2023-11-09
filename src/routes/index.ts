import express,{ Request, Response, NextFunction }  from "express";
const router = express.Router();


/* GET home page. */
router.get('/', function(req:Request, res: Response, next:NextFunction) {
  res.render('index', { title: 'Express' });
});

//health check
router.get('/health', async (req:Request, res:Response)=>{
  return res.status(200).json({
    status: "Working",
    message: `Welcome to Express`
  })
})
export default router;
