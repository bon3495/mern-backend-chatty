import fs from 'fs';
import ejs from 'ejs';
import { IResetPasswordParams } from '@user/interfaces/user.interface';

class ResetPasswordTemplate {
  public getTemplate({
    username,
    email,
    ipaddress,
    date,
  }: IResetPasswordParams): string {
    return ejs.render(fs.readFileSync(`${__dirname}/index.ejs`, 'utf-8'), {
      username,
      email,
      ipaddress,
      date,
      image_url: 'https://img.icons8.com/ios11/600/000000/forgot-password.png',
    });
  }
}

export const resetPasswordTemplate: ResetPasswordTemplate =
  new ResetPasswordTemplate();
