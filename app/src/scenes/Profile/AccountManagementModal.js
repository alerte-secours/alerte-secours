import React, { useCallback, useEffect, useRef, useState } from "react";

import { Portal, Modal } from "react-native-paper";

import { useStyles } from "./styles";

import { setA11yFocusAfterInteractions } from "~/lib/a11y";

import AccountManagementModalConnect from "./AccountManagementModalConnect";
import AccountManagementModalDestroy from "./AccountManagementModalDestroy";
import AccountManagementModalImpersonate from "./AccountManagementModalImpersonate";

import Text from "~/components/Text";

export default function AccountManagementModal({
  modalState,
  profileData,
  waitingSmsType,
  clearAuthWaitParams,
  triggerRefs,
}) {
  const styles = useStyles();
  const [modal, setModal] = modalState;
  const { visible, component } = modal;
  const [authMethod, setAuthMethod] = useState(false);

  const titleRef = useRef(null);
  const closeModal = useCallback(() => {
    setModal({
      visible: false,
    });
    setAuthMethod(false);
  }, [setModal]);

  useEffect(() => {
    if (visible) {
      setA11yFocusAfterInteractions(titleRef);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) return;

    const triggerRef = triggerRefs?.[component];
    if (triggerRef?.current) {
      setA11yFocusAfterInteractions(triggerRef);
    }
    // Intentionally include `component` so we restore to the correct trigger.
  }, [visible, component, triggerRefs]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={closeModal}
        contentContainerStyle={styles.bottomModalContentContainer}
        accessibilityViewIsModal
      >
        {/* Invisible header to control initial focus and SR context */}
        <Text
          ref={titleRef}
          accessibilityRole="header"
          style={{ height: 0, width: 0, opacity: 0 }}
        >
          {component === "destroy"
            ? "Supprimer le compte"
            : "Se connecter à un compte"}
        </Text>
        {visible && component === "connect" && (
          <AccountManagementModalConnect
            closeModal={closeModal}
            profileData={profileData}
            authMethod={authMethod}
            setAuthMethod={setAuthMethod}
            waitingSmsType={waitingSmsType}
            clearAuthWaitParams={clearAuthWaitParams}
          />
        )}
        {visible && component === "destroy" && (
          <AccountManagementModalDestroy
            closeModal={closeModal}
            profileData={profileData}
          />
        )}
        {visible && component === "impersonate" && (
          <AccountManagementModalImpersonate
            closeModal={closeModal}
            profileData={profileData}
          />
        )}
      </Modal>
    </Portal>
  );
}
