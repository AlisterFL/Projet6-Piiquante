const Sauce = require("../models/Sauce");
const fs = require("fs");
const Joi = require("joi"); // Contrôle les champs entrés dans les formulaires.

exports.createSauce = (req, res, next) => {
  // Vérifie la saisie du formulaire de création de sauce selon le schéma suivant.
  const schema = Joi.object().keys({
    userId: Joi.string().required(),
    name: Joi.string().min(3).max(40).required().messages({
      "string.min": 'Le champ "name" doit avoir au moins {#limit} caractères.',
      "string.max":
        'Le champ "name" doit avoir au maximum {#limit} caractères.',
    }),
    manufacturer: Joi.string().min(2).max(30).required().messages({
      "string.min": 'Le champ "name" doit avoir au moins {#limit} caractères.',
      "string.max":
        'Le champ "name" doit avoir au maximum {#limit} caractères.',
    }),
    description: Joi.string().min(5).max(100).required().messages({
      "string.min": 'Le champ "name" doit avoir au moins {#limit} caractères.',
      "string.max":
        'Le champ "name" doit avoir au maximum {#limit} caractères.',
    }),
    mainPepper: Joi.string().min(3).max(30).required().messages({
      "string.min": 'Le champ "name" doit avoir au moins {#limit} caractères.',
      "string.max":
        'Le champ "name" doit avoir au maximum {#limit} caractères.',
    }),
    heat: Joi.number().required(),
  });

  // Si erreur, on retour l'erreur.
  const validationResult = schema.validate(JSON.parse(req.body.sauce));

  if (validationResult.error) {
    const missingParams = validationResult.error.details.map(
      (detail) => detail.message
    );
    res.status(400).json({
      error: `Paramètre(s) manquant(s) : ${missingParams.join(", ")}`,
    });

    console.log(`Paramètre(s) manquant(s) : ${missingParams.join(", ")}`);

    //supression image
    fileName = req.file.filename;
    console.log("filename:" + fileName)
    fs.unlink(`images/${fileName}`, (err) => {
      if (err) {
        console.error("Une erreur s'est produite lors de la suppression du fichier :", err);
        return;
      }
      console.log("Le fichier a été supprimé avec succès !");
    });

  } else {
    // Sinon on ajoute la sauce
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;

    const sauce = new Sauce({
      ...sauceObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
      likes: 0,
      dislikes: 0,
    });
  
    sauce
      .save()
      .then(() => {
        res.status(201).json({ message: "Sauce créée !" });
      })
      .catch((error) => {
        res.status(400).json({ error });
      });
  }
};
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        Sauce.updateOne(
          { _id: req.params.id },
          { ...sauceObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      console.log(sauces);
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.voteForSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      let like = req.body.like;
      let userId = req.auth.userId;
      let usersLiked = sauce.usersLiked;
      let usersDisliked = sauce.usersDisliked;

      console.log("-----------------------");
      console.log("like = " + like);
      console.log("userID = " + userId);
      console.log("auth = " + req.auth.userId);

      if (like == 1) {
        if (!usersLiked.includes(userId)) {
          usersLiked.push(userId);
          sauce.likes++;
        } else {
          console.log("déjà compris dedans");
        }
      } else if (like == -1) {
        if (!usersDisliked.includes(userId)) {
          usersDisliked.push(userId);
          sauce.dislikes++;
        }
      } else if (like == 0) {
        if (usersLiked.includes(userId)) {
          index = usersLiked.indexOf(userId);
          usersLiked.splice(index, 1);
          sauce.likes--;
        } else if (usersDisliked.includes(userId)) {
          index = usersDisliked.indexOf(userId);
          usersDisliked.splice(index, 1);
          sauce.dislikes--;
        }
      }

      console.log("-----------------------");
      console.log(sauce);

      sauce
        .save()
        .then(() => res.status(200).json({ message: "Sauce évaluée !" }))
        .catch((error) =>
          res.status(400).json({ error: "Impossible d'évaluer la sauce" })
        );
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};
