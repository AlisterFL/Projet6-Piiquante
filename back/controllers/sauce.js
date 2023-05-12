const Sauce = require("../models/Sauce");
const fs = require("fs");

exports.createSauce = (req, res, next) => {
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
