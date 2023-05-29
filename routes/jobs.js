const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, isAdminn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const Jobs = require("../models/jobs");
const { createToken } = require("../helpers/tokens");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = express.Router();


router.get('/',async (req,res,next) => {
    try {
        if(Object.keys(req.query).length >= 1){
          const keys = Object.keys(req.query)
          const values = Object.values(req.query)
          const jobs = await Jobs.getByFilter(keys,values)
          return res.json({jobs})
        }
        const jobs = await Jobs.findAll();
        return res.json({ jobs });
      } catch (err) {
        return next(err);
      }
})    
    

router.post("/", isAdminn, async function (req, res, next) {
        try {
          const validator = jsonschema.validate(req.body, jobNewSchema);
          if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
          }
          console.log(req.body)
          const job = await Jobs.create(req.body);
          return res.status(201).json({ job });
        } catch (err) {
          return next(err);
        }
});



router.get("/:id", async function (req, res, next) {
    try {
      const job = await Jobs.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });



  router.patch("/:id", isAdminn, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Jobs.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });


  router.delete("/:id", isAdminn, async function (req, res, next) {
    try {
      await Jobs.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  });
  
  
  module.exports = router;
