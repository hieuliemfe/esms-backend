'use strict';
import { query } from "express-validator";
import models from '../db/models/index';
import status from 'http-status';
import url from 'url';

export default {

    view: {
        async get(req, res, next) {

            try {
                const queues = await models.Queue.findAll({
                    include: [{
                        model: models.Status,
                        as: "Status"
                    },
                    {
                        model: models.Category,
                        as: "Category"
                    }
                    ],
                    attributes: ["id", "number", "createdAt", "updatedAt"]
                });
                res.status(status.OK)
                    .send({
                        status: true,
                        message: queues,
                    });
            } catch (error) {
                next(error);
            }
        }
    },
};
