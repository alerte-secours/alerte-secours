import React from "react";
import Layout from "~/layout/Layout";

import NetworkProviders from "~/network/NetworkProviders";
import { useEULA } from "~/hooks/useEULA";
import EULA from "~/components/EULA";
import PermissionWizard from "~/containers/PermissionWizard";
import HasRelativeContainer from "~/containers/HasRelativeContainer";
import { usePermissionWizardState } from "~/stores";

import DataQuery from "./DataQuery";
import DataSubscription from "./DataSubscription";

import { Provider as I18nContextProvider } from "~/i18n/context";
import { NowProvider } from "~/components/NowProvider";
import { AudioProvider } from "~/components/AudioProvider";
import TreeWrapper from "./TreeWrapper";
import UnreadMessageAlert from "~/components/UnreadMessageAlert";

export default React.memo(function AppRoot() {
  const { eulaAccepted, loading: eulaLoading, acceptEULA } = useEULA();
  const { completed: wizardCompleted } = usePermissionWizardState([
    "completed",
  ]);

  if (eulaLoading) {
    return null;
  }

  return (
    <>
      <NetworkProviders>
        <TreeWrapper>
          <DataQuery />
          <DataSubscription />
          <HasRelativeContainer />
          <AudioProvider>
            <I18nContextProvider>
              <NowProvider>
                <Layout />
              </NowProvider>
            </I18nContextProvider>
          </AudioProvider>
        </TreeWrapper>
        <EULA visible={!eulaAccepted} onAccept={acceptEULA} />
        <PermissionWizard visible={eulaAccepted && !wizardCompleted} />
        <UnreadMessageAlert />
      </NetworkProviders>
    </>
  );
});
