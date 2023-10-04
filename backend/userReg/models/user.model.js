module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("users", {
      username: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      createdAt: {
        type: Sequelize.DATE, // Ensure you have this column definition
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE, // Ensure you have this column definition
        allowNull: false
      }
    });
  
    return User;
  };
  