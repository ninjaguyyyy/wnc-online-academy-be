const { UsersResponses } = require('../helpers/responses/index');
const _ = require('lodash');
const randomstring = require('randomstring');
const hashingManager = require('../helpers/hashing.helper');
const tokenManager = require('../helpers/token.helper');
const UserRepository = require('../models/repositories/user.repository');
const UserFactory = require('../models/factories/user.factory');
const dayjs = require('dayjs');
require('dayjs/locale/vi');
dayjs.locale('vi');
const { randomOTPNumber } = require('../helpers/random');
const emailService = require('./email.service');

const userService = {
  register,
  verifyUser,
  login,
  getAll,
  resetOTP,
  updateProfile,
  refreshToken,
  changePassword,
};

async function register(user) {
  let isUsernameExist = await checkUsernameExist(user.userName);
  if (isUsernameExist) {
    return UsersResponses.RegisterResponses.registerAlreadyUsername();
  }

  let isEmailExist = await checkEmailExist(user.email);
  if (isEmailExist) {
    return UsersResponses.RegisterResponses.registerAlreadyEmail();
  }

  const hashedPassword = hashingManager.generateHashPassword(user.passWord);
  user.passWord = hashedPassword;

  user.otp = createOTP();

  const userDocument = await UserRepository.insertUser(user);

  emailService.sendOTP(user.email, user.otp.number);

  return UsersResponses.RegisterResponses.registerSuccess(userDocument);
}

async function resetOTP(email) {
  const user = await UserFactory.findByEmail(email);
  if (!user) {
    return UsersResponses.ResetResponses.emailNotExist();
  }

  user.otp = createOTP();
  const updatedUser = await user.save();

  return UsersResponses.ResetResponses.resetSuccess(updatedUser);
}

async function verifyUser({ email, otp }) {
  const user = await UserFactory.findByEmail(email);
  if (!user) {
    return UsersResponses.VerifyResponses.emailNotExist();
  }

  if (user.otp.number !== otp) {
    return UsersResponses.VerifyResponses.verifyFailOtpIsNotCorrect();
  }
  if (dayjs(user.otp.expired).isBefore(dayjs())) {
    return UsersResponses.VerifyResponses.verifyFailOtpExpired();
  }

  user.isActivated = true;
  const updatedUser = await user.save();

  return UsersResponses.VerifyResponses.verifySuccess(updatedUser);
}

async function login(user) {
  const { userName, passWord, role } = user;

  let isUsernameExist = await checkUsernameExist(userName);
  if (!isUsernameExist) {
    return UsersResponses.LoginResponses.loginNotExistUsername();
  }

  const userDocument = await UserFactory.findByUsername(userName);

  if (userDocument.role !== role) {
    return UsersResponses.LoginResponses.loginNotCorrectRole();
  }

  if (!userDocument.isActivated) {
    return UsersResponses.LoginResponses.loginFailUserAlreadyActivated();
  }

  const isValidatePassword = hashingManager.checkValidPassword(
    passWord,
    userDocument.passWord
  );
  if (!isValidatePassword) {
    return UsersResponses.LoginResponses.loginNotCorrectPassword();
  }

  var accessToken = tokenManager.generateAccessToken({
    userId: userDocument._id,
    role,
  });

  const refreshToken = randomstring.generate();
  userDocument.refreshToken = refreshToken;
  await userDocument.save();

  return UsersResponses.LoginResponses.loginSuccess(accessToken, refreshToken);
}

async function refreshToken({ accessToken, refreshToken }) {
  try {
    const { userId } = tokenManager.verifyTokenIgnoreExpired(accessToken);

    const userDocument = await UserFactory.findById(userId);

    const isValidToken = refreshToken === userDocument.refreshToken;
    if (isValidToken) {
      const newAccessToken = tokenManager.generateAccessToken({
        userId,
        role: userDocument.role,
      });

      return UsersResponses.RefreshTokenResponses.refreshSuccess(
        newAccessToken
      );
    }

    return UsersResponses.RefreshTokenResponses.refreshFailTokenRevoked();
  } catch (err) {
    return UsersResponses.RefreshTokenResponses.refreshFailTokenInvalid();
  }
}

async function getAll() {
  const users = await UserFactory.findAll();

  return UsersResponses.GetAllResponses.getAllSuccess(users);
}

async function updateProfile(user, dataToUpdate) {
  const filteredDataToUpdate = _.pickBy(dataToUpdate);

  const updatedUser = await UserRepository.updateUser(
    user.userId,
    filteredDataToUpdate
  );
  return UsersResponses.UpdateProfileResponses.updateSuccess(updatedUser);
}

async function changePassword(user, { oldPassword, newPassword }) {
  const userDocument = await UserFactory.findById(user.userId);

  const isValidatePassword = hashingManager.checkValidPassword(
    oldPassword,
    userDocument.passWord
  );
  if (!isValidatePassword) {
    return UsersResponses.ChangePasswordResponses.changeFailWrongPassword();
  }

  const hashedPassword = hashingManager.generateHashPassword(newPassword);

  await UserRepository.updateUser(user.userId, {
    passWord: hashedPassword,
  });
  return UsersResponses.ChangePasswordResponses.changeSuccess();
}

async function getProfile(user) {
  const userDocument = await UserFactory.findById(user.userId);
  return UsersResponses.GetProfileResponses.getSuccess(userDocument);
}

const checkUsernameExist = async (userName) => {
  let result = false;

  const userDocument = await UserFactory.findByUsername(userName);
  if (userDocument) {
    result = true;
  }

  return result;
};

const checkEmailExist = async (username) => {
  let result = false;

  const userDocument = await UserFactory.findByEmail(username);
  if (userDocument) {
    result = true;
  }

  return result;
};

function createOTP() {
  return {
    number: randomOTPNumber(),
    expired: dayjs().add(5, 'm').format(),
  };
}

module.exports = userService;
