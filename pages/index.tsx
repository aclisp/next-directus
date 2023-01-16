import { Text } from "@mantine/core";
import { getIronSession } from "iron-session";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { AppHeaderProps } from "../components/AppHeader";
import { AppLayout } from "../components/AppLayout";
import { getAccessToken } from "../lib/directus/transport";
import { getCurrentUserInfo } from "../lib/directus/user";
import { getLogger } from "../lib/log";
import { sessionOptions } from "../lib/session";

const logger = getLogger("index");

export const getServerSideProps: GetServerSideProps<AppHeaderProps> = async (
  context,
) => {
  // As we are in the home (index) page already, we do not need
  // withIronSessionSsr which redirect to `login` on error.
  const session = await getIronSession(
    context.req,
    context.res,
    sessionOptions,
  );
  // So we have to call getAccessToken manually.
  try {
    await getAccessToken(session, () => {
      session.save();
    });
  } catch (error) {
    logger.debug(`${error}`);
    return {
      props: {
        isLogin: false,
      },
    };
  }
  // At this time session is ensured to has loginInfo.
  const userInfo = await getCurrentUserInfo(session);
  return {
    props: {
      isLogin: true,
      userInfo,
      accessToken: session.loginInfo?.access_token,
    },
  };
};

export default function Home(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <AppLayout {...props}>
      <Text align="center">Hello world!</Text>
    </AppLayout>
  );
}
