// belum di pake - 22 mei 2026
import Users from "../models/UserModel.js";
import jwt from "jsonwebtoken";

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: "Tidak ada refresh token" });

    const user = await Users.findAll({
      where: {
        refresh_token: refreshToken,
      },
    });
    if (!user[0]) return res.sendStatus(403);

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) return res.sendStatus(403);
        const userId = user[0].id;
        const name = user[0].name;
        const titlePrefix = user[0].titlePrefix;
        const fullName = user[0].fullName;
        const titleSuffix = user[0].titleSuffix;
        const email = user[0].email;
        const nip = user[0].nip;
        const role = user[0].roleId;

        const accessToken = jwt.sign(
          {
            userId,
            name,
            email,
            nip,
            role,
            titlePrefix,
            fullName,
            titleSuffix,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "15m",
          },
        );
        // const accessToken = jwt.sign(
        //   {
        //     id: user.id,
        //     firstName: user.firstName,
        //     middleName: user.middleName,
        //     lastName: user.lastName,
        //     email: user.email,
        //     role: user.role,
        //   },
        //   process.env.JWT_SECRET,
        //   { expiresIn: "15m" }
        // );
        res.json({ accessToken });
      },
    );
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Server error" });
  }
};
