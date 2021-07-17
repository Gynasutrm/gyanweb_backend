const jwt = require('jsonwebtoken');
const config = require("../config/connection");
const moment = require("moment");

// async function paggination(req, res, next)
// {
  
//   next();
// }
// module.exports = paggination

exports.paggination = function(tableName){
    return async (req, res, next) => {
        try {
            let limit = 10;
            let pageCount=0;
            const countObj = await config.sequelize.query(
              `SELECT count(*) as total FROM ${tableName} WHERE is_deleted = false`,
              {
                raw: true,
                type: config.sequelize.QueryTypes.SELECT,
              }
            );
            const totalcount=countObj[0].total;
            if(!totalcount){
              return res
              .status(200)
              .json({ statusCode: 203, message: "No Topic Found!" });
            }
	let page = req.query.page?req.query.page:"";
            if(page==undefined || page ==""){
              page=1;
	      limit=totalcount
            }
            page=parseInt(page);
            const startIndex = (page - 1) * limit;
            console.log('@@@@@@@@@@',startIndex,page,limit);

	    if(limit!=0)
            	pageCount = parseInt(Math.ceil(totalcount / limit));
            req.page = {"total_page":pageCount,"current_page":page,"total_records":totalcount,
            "limit":limit,"startIndex":startIndex};

            next();
        }
        catch (error) {
            next(error)
        }
    }
}
