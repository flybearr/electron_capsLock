const config = require('config')
const logger = require('log4js')

logger.configure({
  appenders: {
    output: {
      type: config.LogType, // 'console', 'file', 'dataFile
      filename: config.LogPath,
      // maxLogSize: 10 * 1024 * 1024,
      // backups: 5,
      keepFileExt: true,
      numBackups: config.NumOfBackup === undefined ? 30 : config.NumOfBackup,
      compress: true,
      category: 'normal'
    }
    // fronend_output: {
    //   type: "dateFile", // 'console', 'file', 'dataFile
    //   filename: config.weblog.LogPath_web,
    //   // maxLogSize: 10 * 1024 * 1024,
    //   // backups: 5,
    //   keepFileExt: true,
    //   numBackups:
    //     config.WebLog.NumOfBackup === undefined
    //       ? 30
    //       : config.WebLog.NumOfBackup,
    //   compress: true,
    //   category: "normal",
    // },
  },
  categories: {
    default: { appenders: ['output'], level: config.LogMode }
    // fronend_output: {
    //   appenders: ["fronend_output"],
    //   level: config.WebLog.LogMode,
    // },
  }
})

let outLog = logger.getLogger('output')
// let fronend_output = logger.getLogger("fronend_output");

function output(type, msg) {
  //0: trace, 1: debug, 2: info, 3: warn, 4: error, 5: fatal
  switch (type) {
    case 0:
      outLog.trace(msg)
      break
    case 1:
      outLog.debug(msg)
      break
    case 2:
      outLog.info(msg)
      break
    case 3:
      outLog.warn(msg)
      break
    case 4:
      outLog.error(msg)
      break
    case 5:
      outLog.fatal(msg)
      break
    default:
      console.log(msg)
      break
  }
}
export default output

// exports.fronend_output = function (type, msg) {

//   //0: trace, 1: debug, 2: info, 3: warn, 4: error, 5: fatal

//   switch (type) {
//     case 0:
//       fronend_output.trace(msg);
//       break;
//     case 1:
//       fronend_output.debug(msg);
//       break;
//     case 2:
//       fronend_output.info(msg);
//       break;
//     case 3:
//       fronend_output.warn(msg);
//       break;
//     case 4:
//       fronend_output.error(msg);
//       break;
//     case 5:
//       fronend_output.fatal(msg);
//       break;
//     default:
//       console.log(msg);
//       break;
//   }
// };
