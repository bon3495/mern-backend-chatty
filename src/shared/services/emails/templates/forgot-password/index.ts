import fs from 'fs';
import ejs from 'ejs';

class ForgotPasswordTemplate {
  public getTemplate(username: string, resetLink: string): string {
    return ejs.render(fs.readFileSync(`${__dirname}/index.ejs`, 'utf-8'), {
      username,
      resetLink,
      image_url: 'https://img.icons8.com/ios11/600/000000/forgot-password.png',
    });
  }
}

export const forgotPasswordTemplate: ForgotPasswordTemplate =
  new ForgotPasswordTemplate();
