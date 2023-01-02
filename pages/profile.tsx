import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getCurrentUserInfo, UserInfo } from "../lib/directus/user";
import { sessionOptions, withIronSessionSsr } from "../lib/session";
import { getLogger } from "../lib/log";
import { Avatar, Paper, Text } from "@mantine/core";
import { getFileLink } from "../lib/directus/utils";

const logger = getLogger("profile");

type Props = {
  userInfo: UserInfo;
  accessToken: string;
};

export const getServerSideProps: GetServerSideProps<Props> = withIronSessionSsr(
  async (context) => {
    const { req } = context;
    const userInfo = await getCurrentUserInfo(req.session);
    const result = {
      props: {
        userInfo,
        accessToken: req.session.loginInfo?.access_token ?? "",
      },
    };
    logger.debug(`await getCurrentUserInfo: ${JSON.stringify(result)}`);
    return result;
  },
  sessionOptions,
);

export default function Profile(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { userInfo, accessToken } = props;
  return (
    <Paper
      mx="auto"
      radius="md"
      withBorder
      p="lg"
      sx={(theme) => ({
        maxWidth: 300,
        backgroundColor: theme.colorScheme === "dark"
          ? theme.colors.dark[8]
          : theme.white,
      })}
    >
      <Avatar
        src={getFileLink(userInfo.avatar, accessToken)}
        size={120}
        radius={120}
        mx="auto"
      />
      <Text align="center" size="lg" weight={500} mt="md">
        {userInfo.first_name} {userInfo.last_name}
      </Text>
    </Paper>
  );
}
