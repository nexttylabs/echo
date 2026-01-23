/*
 * Copyright (c) 2026 Nexttylabs Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { describe, expect, it } from "bun:test";
import {
  EmbeddedFeedbackForm,
  FEEDBACK_CANCEL_LABEL,
  FEEDBACK_TOAST_DURATION_MS,
  FEEDBACK_DESCRIPTION_LABEL,
  FEEDBACK_DIALOG_TITLE,
  FEEDBACK_PRIORITY_LABEL,
  FEEDBACK_PRIORITY_OPTIONS,
  FEEDBACK_SUBMIT_LABEL,
  FEEDBACK_TITLE_LABEL,
  FEEDBACK_TRIGGER_LABEL,
  FEEDBACK_TYPE_LABEL,
  FEEDBACK_TYPE_OPTIONS,
  FEEDBACK_SUCCESS_MESSAGE,
  FEEDBACK_TRACKING_LABEL,
  FEEDBACK_PREFILL_KEYS,
} from "@/components/feedback/embedded-feedback-form";
import { FileUpload } from "@/components/feedback/file-upload";

describe("EmbeddedFeedbackForm", () => {
  it("is a function", () => {
    expect(typeof EmbeddedFeedbackForm).toBe("function");
  });

  it("exports FileUpload", () => {
    expect(typeof FileUpload).toBe("function");
  });

  it("exposes dialog copy", () => {
    expect(FEEDBACK_TRIGGER_LABEL).toBe("反馈");
    expect(FEEDBACK_DIALOG_TITLE).toBe("提交反馈");
  });

  it("exposes field labels", () => {
    expect(FEEDBACK_TITLE_LABEL).toBe("标题");
    expect(FEEDBACK_DESCRIPTION_LABEL).toBe("描述");
    expect(FEEDBACK_TYPE_LABEL).toBe("反馈类型");
    expect(FEEDBACK_PRIORITY_LABEL).toBe("优先级");
  });

  it("exposes action labels", () => {
    expect(FEEDBACK_SUBMIT_LABEL).toBe("提交");
    expect(FEEDBACK_CANCEL_LABEL).toBe("取消");
  });

  it("exposes select options", () => {
    expect(FEEDBACK_TYPE_OPTIONS).toEqual([
      { value: "bug", label: "Bug" },
      { value: "feature", label: "功能请求" },
      { value: "issue", label: "问题" },
      { value: "other", label: "其他" },
    ]);

    expect(FEEDBACK_PRIORITY_OPTIONS).toEqual([
      { value: "low", label: "低" },
      { value: "medium", label: "中" },
      { value: "high", label: "高" },
    ]);
  });

  it("exposes success copy", () => {
    expect(FEEDBACK_SUCCESS_MESSAGE).toBe("反馈提交成功");
    expect(FEEDBACK_TRACKING_LABEL).toBe("跟踪链接");
  });

  it("defines toast duration", () => {
    expect(FEEDBACK_TOAST_DURATION_MS).toBe(6000);
  });

  it("exposes prefill keys", () => {
    expect(FEEDBACK_PREFILL_KEYS).toEqual([
      "title",
      "description",
      "type",
      "priority",
    ]);
  });
});
