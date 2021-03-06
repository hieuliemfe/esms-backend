"use strict";

import models from "../db/models/index";
import status from "http-status";
import { createEmail, sendEmail } from "../services/email-service/service";
import { mailTypes } from "../services/email-service/contentConfig";
import jwt from "jsonwebtoken";
export default {
  send_action_email: {
    async post(req, res, next) {
      try {
        const { type, employeeCode, date, startDate } = req.body;
        if (type == undefined || employeeCode == undefined) {
          res.status(status.EXPECTATION_FAILED).send({
            success: false,
            message: "Must input type type AND employeeCode",
          });
        } else if (
          type != mailTypes.CHEERING &&
          type != mailTypes.DAY_OFF &&
          type != mailTypes.MAKE_APPOINTMENT &&
          type != mailTypes.SUSPENSION
        ) {
          res.status(status.EXPECTATION_FAILED).send({
            success: false,
            message:
              "Invalid mail type. Only use: " +
              "(" +
              mailTypes.CHEERING +
              "|" +
              mailTypes.DAY_OFF +
              "|" +
              mailTypes.MAKE_APPOINTMENT +
              ")",
          });
        } else if (
          type.toLowerCase() == mailTypes.MAKE_APPOINTMENT &&
          date == undefined
        ) {
          res.status(status.EXPECTATION_FAILED).send({
            success: false,
            message: "Must input appointment date for appoiment email type.",
          });
        } else if (
          type.toLowerCase() == mailTypes.SUSPENSION &&
          (date == undefined || startDate == undefined)
        ) {
          res.status(status.EXPECTATION_FAILED).send({
            success: false,
            message: "Must input suspension start date and expiration date.",
          });
        } else {
          const employee = await models.Employee.findOne({
            where: {
              employeeCode: employeeCode,
            },
          });
          if (!employee) {
            res.status(status.EXPECTATION_FAILED).send({
              success: false,
              message: "Employee not found.",
            });
          } else {
            const email = await createEmail(employee, type, date, "", startDate);
            const result = await sendEmail(email, employee.email);
            if(type.toLowerCase() == mailTypes.MAKE_APPOINTMENT){
              const token = req.headers.authorization.replace("Bearer ", "");
              const tokenDecoded = jwt.decode(token);
              const manager = await models.Employee.findOne({
                attributes: { exclude: ["password", "role_id", "roleId"] },
                include: {
                  model: models.Role,
                  as: "Role",
                },
                where: { id: tokenDecoded.employeeId },
              })
              const managerMail = await createEmail(manager, mailTypes.MANAGER_APPOINTMENT, date, "", null, employee.fullname)
              const managerMailReslt = await sendEmail(managerMail, manager.email)
            }
            res.send({
              success: true,
              message: result,
            });
          }
        }
      } catch (error) {
        next(error);
      }
    },
  },

  send_stress_solution_email: {
    async post(req, res, next) {
      try {
        const { employeeCode, videoUrl } = req.body;
        if (employeeCode == undefined || videoUrl == undefined) {
          res.status(status.EXPECTATION_FAILED).send({
            success: false,
            message: "Must input videoUrl type AND employeeCode",
          });
        } else {
          const employee = await models.Employee.findOne({
            where: {
              employeeCode: employeeCode,
            },
          });
          if (!employee) {
            res.status(status.EXPECTATION_FAILED).send({
              success: false,
              message: "Employee not found.",
            });
          } else {
            const email = await createEmail(
              employee,
              "stress_relieving",
              "",
              videoUrl
            );
            const result = await sendEmail(email, employee.email);
            res.send({
              success: true,
              message: result,
            });
          }
        }
      } catch (error) {
        next(error);
      }
    },
  },
  get_email_types: {
    async get(req, res, next) {
      try {
        res.status(status.OK).send(mailTypes);
      } catch (error) {
        next(error);
      }
    },
  },
};
