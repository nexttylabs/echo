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

const statusLabels: Record<string, string> = {
  new: "新接收",
  "in-progress": "处理中",
  planned: "已规划",
  completed: "已完成",
  closed: "已关闭",
};

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
  .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; }
  .status-new { background: #dbeafe; color: #1e40af; }
  .status-in-progress { background: #fef3c7; color: #92400e; }
  .status-planned { background: #e9d5ff; color: #6b21a8; }
  .status-completed { background: #d1fae5; color: #065f46; }
  .status-closed { background: #e5e7eb; color: #374151; }
  .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; }
  .comment-box { background: white; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0; }
`;

interface StatusChangeEmailData {
  feedbackTitle: string;
  feedbackId: number;
  oldStatus: string;
  newStatus: string;
  feedbackUrl: string;
}

export function generateStatusChangeEmail(
  data: StatusChangeEmailData,
): { subject: string; html: string } {
  const subject = `反馈状态更新：${data.feedbackTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>反馈状态更新</h1>
          </div>
          <div class="content">
            <p>您好，</p>
            <p>您提交的反馈状态已更新。</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${escapeHtml(data.feedbackTitle)}</h3>
              <p style="color: #666;">
                状态从
                <span class="status-badge status-${data.oldStatus}">${statusLabels[data.oldStatus] || data.oldStatus}</span>
                变更为
                <span class="status-badge status-${data.newStatus}">${statusLabels[data.newStatus] || data.newStatus}</span>
              </p>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.feedbackUrl}" class="button">查看反馈详情</a>
            </p>

            <p style="font-size: 12px; color: #999; text-align: center;">
              如果您不想收到此类通知，请前往设置页面调整通知偏好。
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

interface NewCommentEmailData {
  feedbackTitle: string;
  feedbackId: number;
  authorName: string;
  commentContent: string;
  feedbackUrl: string;
}

export function generateNewCommentEmail(
  data: NewCommentEmailData,
): { subject: string; html: string } {
  const subject = `新评论：${data.feedbackTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>新评论通知</h1>
          </div>
          <div class="content">
            <p>您好，</p>
            <p><strong>${escapeHtml(data.authorName)}</strong> 在您关注的反馈中发表了新评论。</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${escapeHtml(data.feedbackTitle)}</h3>
            </div>

            <div class="comment-box">
              <p style="margin: 0;">${escapeHtml(data.commentContent)}</p>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.feedbackUrl}" class="button">查看并回复</a>
            </p>

            <p style="font-size: 12px; color: #999; text-align: center;">
              如果您不想收到此类通知，请前往设置页面调整通知偏好。
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
