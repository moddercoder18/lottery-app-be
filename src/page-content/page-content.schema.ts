import * as mongoose from "mongoose";

import {PageContent} from "./page-content.interface";

export const PageContentSchema = new mongoose.Schema<PageContent>(
  {
    name: {type: String},
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    slug: {type: String,  unique: true},
    content: {type: Object},
    subject: {type: Object},
    template: { type: String, default: 'html'},
    isActive: {type: Boolean, default: true},
    keywords: [{ type: Object }]
  },
  {timestamps: true},
);

/**
 * Methods.
 */
PageContentSchema.methods.getPublicData = function () {
  const {_id, name, userId, slug, content, isActive, keywords} = this;
  return {_id, name, userId, slug, content, isActive, keywords};
};
