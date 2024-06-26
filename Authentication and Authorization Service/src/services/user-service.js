const UserRepository = require('../repository/user-repository');
const jwt = require('jsonwebtoken');
const { JWT_KEY } = require('../config/serverConfig');
const bcrypt = require('bcrypt');
const AppErrors = require('../utils/error-handler');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }
  async create(data) {
    try {
      const user = await this.userRepository.create(data);
      return user;
    } catch (error) {
      if(error.name === 'SequelizeValidationError'){
        throw new ValidationError(error);
      }
      console.log('Something went wrong on user service create method');
      throw new AppErrors(
        'ServerError',
        'Something went wrong in service',
        'Logical Issue found',
        500
      );
    }
  }

  async signIn(email , plainPassword){
    try {
      //fetch user using email: 
      const user = await this.userRepository.getByEmail(email);
      //compare password with the one in the database
      const passwordsMatch = this.checkPassword(plainPassword, user.password);
      //if password does not match, throw an error
      if(!passwordsMatch){
        console.log('Password does not match');
        throw {error:'Incorrect password'}
      }
      //if password matches:
      //create a new JWT token and send to user 
      const newJWT = this.createToken({email:user.email, id:user.id});
      return newJWT;
    } catch (error) {
      console.log('Something went wrong on user service signIn method');
      throw error;
    }
  }

  createToken(user) {
    try {
      const result = jwt.sign(user, JWT_KEY, { expiresIn: '1h' });
      return result;
    } catch (error) {
      console.log('Something went wrong on user service createToken method');
      throw error;
    }
  }

  verifyToken(token) {
    try {
      const response = jwt.verify(token, JWT_KEY);
      return response;
    } catch (error) {
      console.log('Something went wrong on user service verifyToken method');
      throw error;
    }
  }


  checkPassword(userInputPassword, encryptedPassword) {
    try {
      return bcrypt.compareSync(userInputPassword, encryptedPassword);
    } catch (error) {
      console.log('Something went wrong on user service checkPassword method');
      throw error;

    }
  }

  async isAuthenticated(token){
    try {
      const response =  this.verifyToken(token);
      if(!response){
        throw {error:'Invalid token'}
      }
      const user = await this.userRepository.getById(response.id);
      if(!user){
        throw {error:'User not found with corresponding token'}
      }
      return user.id;
    } catch (error) {
      console.log('Something went wrong on user service isAuthenticated method');
      throw error;
    }
  }

  isAdmin(userId){
    try {
      return this.userRepository.isAdmin(userId);
    } catch (error) {
      console.log('Something went wrong on user service isAdmin method');
      throw error;
    }
  }
 
}

module.exports = UserService;



