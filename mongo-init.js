db.createUser(
        {
            user: "lotteryapp",
            pwd: "lotteryapp",
            roles: [
                {
                    role: "readWrite",
                    db: "lotteryapp"
                }
            ]
        }
);
