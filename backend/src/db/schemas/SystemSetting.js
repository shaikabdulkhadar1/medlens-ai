const mongoose = require("mongoose");

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Setting key is required"],
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Setting value is required"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "general",
        "ai",
        "storage",
        "email",
        "security",
        "notifications",
        "ui",
        "api",
        "monitoring",
      ],
      default: "general",
    },
    type: {
      type: String,
      required: [true, "Value type is required"],
      enum: ["string", "number", "boolean", "object", "array"],
      default: "string",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    validation: {
      required: {
        type: Boolean,
        default: false,
      },
      min: Number,
      max: Number,
      pattern: String,
      enum: [mongoose.Schema.Types.Mixed],
      custom: String,
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    version: {
      type: Number,
      default: 1,
    },
    history: [
      {
        value: mongoose.Schema.Types.Mixed,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    environment: {
      type: String,
      enum: ["development", "staging", "production", "all"],
      default: "all",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
systemSettingSchema.index({ key: 1 }, { unique: true });
systemSettingSchema.index({ category: 1 });
systemSettingSchema.index({ isPublic: 1 });
systemSettingSchema.index({ environment: 1 });

// Compound indexes
systemSettingSchema.index({ category: 1, isPublic: 1 });
systemSettingSchema.index({ environment: 1, category: 1 });

// Pre-save middleware to validate value type
systemSettingSchema.pre("save", function (next) {
  // Validate value type
  const valueType = typeof this.value;
  const expectedType = this.type;

  let isValid = false;
  switch (expectedType) {
    case "string":
      isValid = valueType === "string";
      break;
    case "number":
      isValid = valueType === "number" && !isNaN(this.value);
      break;
    case "boolean":
      isValid = valueType === "boolean";
      break;
    case "object":
      isValid = valueType === "object" && !Array.isArray(this.value);
      break;
    case "array":
      isValid = Array.isArray(this.value);
      break;
  }

  if (!isValid) {
    return next(
      new Error(
        `Value type mismatch. Expected ${expectedType}, got ${valueType}`
      )
    );
  }

  // Validate required field
  if (
    this.validation.required &&
    (this.value === null || this.value === undefined || this.value === "")
  ) {
    return next(new Error(`Setting ${this.key} is required`));
  }

  // Validate min/max for numbers
  if (expectedType === "number") {
    if (this.validation.min !== undefined && this.value < this.validation.min) {
      return next(new Error(`Value must be at least ${this.validation.min}`));
    }
    if (this.validation.max !== undefined && this.value > this.validation.max) {
      return next(new Error(`Value must be at most ${this.validation.max}`));
    }
  }

  // Validate enum values
  if (this.validation.enum && this.validation.enum.length > 0) {
    if (!this.validation.enum.includes(this.value)) {
      return next(
        new Error(`Value must be one of: ${this.validation.enum.join(", ")}`)
      );
    }
  }

  next();
});

// Method to update value with history
systemSettingSchema.methods.updateValue = function (
  newValue,
  userId,
  reason = ""
) {
  // Add to history
  this.history.push({
    value: this.value,
    changedBy: userId,
    changedAt: new Date(),
    reason: reason || "Value updated",
  });

  // Update value and version
  this.value = newValue;
  this.version += 1;
  this.updatedBy = userId;

  return this.save();
};

// Method to reset to default
systemSettingSchema.methods.resetToDefault = function (userId) {
  if (this.defaultValue !== undefined) {
    return this.updateValue(this.defaultValue, userId, "Reset to default");
  }
  throw new Error("No default value set");
};

// Static method to get settings by category
systemSettingSchema.statics.getByCategory = function (category) {
  return this.find({ category });
};

// Static method to get public settings
systemSettingSchema.statics.getPublic = function () {
  return this.find({ isPublic: true });
};

// Static method to get settings by environment
systemSettingSchema.statics.getByEnvironment = function (environment) {
  return this.find({
    $or: [{ environment: environment }, { environment: "all" }],
  });
};

// Static method to get setting value
systemSettingSchema.statics.getValue = function (key, defaultValue = null) {
  return this.findOne({ key }).then((setting) =>
    setting ? setting.value : defaultValue
  );
};

// Static method to set setting value
systemSettingSchema.statics.setValue = function (
  key,
  value,
  userId,
  reason = ""
) {
  return this.findOne({ key }).then((setting) => {
    if (setting) {
      return setting.updateValue(value, userId, reason);
    } else {
      throw new Error(`Setting ${key} not found`);
    }
  });
};

// Static method to create setting
systemSettingSchema.statics.createSetting = function (settingData, userId) {
  return this.create({
    ...settingData,
    updatedBy: userId,
    history: [
      {
        value: settingData.value,
        changedBy: userId,
        changedAt: new Date(),
        reason: "Initial creation",
      },
    ],
  });
};

// Static method to get settings as object
systemSettingSchema.statics.getSettingsObject = function (
  category = null,
  publicOnly = false
) {
  const query = {};
  if (category) query.category = category;
  if (publicOnly) query.isPublic = true;

  return this.find(query).then((settings) => {
    const settingsObj = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });
    return settingsObj;
  });
};

// Static method to bulk update settings
systemSettingSchema.statics.bulkUpdate = function (updates, userId) {
  const promises = Object.keys(updates).map((key) => {
    return this.setValue(key, updates[key], userId, "Bulk update");
  });
  return Promise.all(promises);
};

module.exports = mongoose.model("SystemSetting", systemSettingSchema);
