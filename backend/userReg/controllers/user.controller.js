const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  // Save User to Database
  try {
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    if (req.body.roles) {
      const roles = await Role.findAll({
        where: {
          name: {
            [Op.or]: req.body.roles,
          },
        },
      });

      const result = await user.setRoles(roles);
      if (result) res.send({ message: "User registered successfully!" });
    } else {
      // User has role = 'user' by default
      const result = await user.setRoles([1]); // Assuming '1' is the ID for the 'user' role
      if (result) res.send({ message: "User registered successfully!" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        username: req.body.username,
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Invalid Password!",
      });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: 86400, // 24 hours
    });

    let authorities = [];
    const roles = await user.getRoles();
    for (let i = 0; i < roles.length; i++) {
      authorities.push("ROLE_" + roles[i].name.toUpperCase());
    }

    req.session.token = token;

    return res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      accessToken: token,
    });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

exports.signout = async (req, res) => {
  try {
    req.session = null;
    return res.status(200).send({
      message: "You've been signed out!",
    });
  } catch (err) {
    this.next(err);
  }
};

exports.allAccess = (req, res) => {
    res.status(200).send("Public Content.");
};
  
exports.userBoard = async (req, res) => {
    try {
      const user = await User.findByPk(req.userId);
  
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
  
      // Fetch the user's roles from the database
      const roles = await user.getRoles();
  
      // Create an array of role names (authorities)
      const authorities = roles.map((role) => "ROLE_" + role.name.toUpperCase());
  
      return res.status(200).send({
        id: user.id,
        username: user.username,
        email: user.email,
        roles: authorities, // Include the authorities (roles) in the response
      });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  };
  
  
  
  exports.moderatorBoard = async (req, res) => {
    try {
      const user = await User.findByPk(req.userId);
  
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
  
      // Fetch the user's roles from the database
      const roles = await user.getRoles();
  
      // Create an array of role names (authorities)
      const authorities = roles.map((role) => "ROLE_" + role.name.toUpperCase());
  
      // Check if the user has the "moderator" role
      if (authorities.includes("ROLE_MODERATOR")) {
        return res.status(200).send({
          id: user.id,
          username: user.username,
          email: user.email,
          roles: authorities,
          message: "Moderator Content: This is the content for moderators.",
        });
      } else {
        return res.status(403).send({
          message: "Unauthorized: You don't have permission to access this content.",
        });
      }
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  };
  
  exports.adminBoard = async (req, res) => {
    try {
      const user = await User.findByPk(req.userId);
  
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
  
      // Fetch the user's roles from the database
      const roles = await user.getRoles();
  
      // Create an array of role names (authorities)
      const authorities = roles.map((role) => "ROLE_" + role.name.toUpperCase());
  
      // Check if the user has the "admin" role
      if (authorities.includes("ROLE_ADMIN")) {
        return res.status(200).send({
          id: user.id,
          username: user.username,
          email: user.email,
          roles: authorities,
          message: "Admin Content: This is the content for administrators.",
        });
      } else {
        return res.status(403).send({
          message: "Unauthorized: You don't have permission to access this content.",
        });
      }
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  };
  