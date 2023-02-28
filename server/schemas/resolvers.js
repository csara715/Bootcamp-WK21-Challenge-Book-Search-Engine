const { AuthenticationError } = require("apollo-server-express");
const { User, Book } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate("books");
      }
      throw new AuthenticationError("Couldn't find user with this id!");
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("No user found with this email address");
      }

      const correctPwd = await user.isCorrectPassword(password);

      if (!correctPwd) {
        throw new AuthenticationError("Your email or password is incorrect");
      }

      const token = signToken(user);

      return { token, user };
    },

    saveBook: async (
      parent,
      { bookId, authors, description, title, image, link },
      context
    ) => {
      if (context.user) {
        const book = await Book.create({
          bookId,
          authors,
          description,
          image,
          link,
          title,
        });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { books: book.bookId } }
        );

        return context.user;
      }
      throw new AuthenticationError("Couldn't find user with this id!");
    },

    deleteBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const book = await Book.findOneAndDelete({
          bookId: bookId,
        });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { books: book.bookId } }
        );

        return context.user;
      }
      throw new AuthenticationError("Couldn't find user with this id!");
    },
  },
};

module.exports = resolvers;
