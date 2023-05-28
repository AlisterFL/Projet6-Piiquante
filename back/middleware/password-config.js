const passwordValidator = require("password-validator"); // vérifier le format du MDP

const passwordSchema = new passwordValidator();

passwordSchema
  .is()
  .min(8)
  .is()
  .max(25)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits()
  .has()
  .symbols();

module.exports = (req, res, next) => {
  if (passwordSchema.validate(req.body.password)) {
    next();
  } else {
    return res.status(400).json({
      error:
        "Le mot de passe doit avoir une longueur de 8 à 25 caractères avec au moins un chiffre, une minuscule, une majuscule et ne possédant pas d'espace",
    });
  }
};
