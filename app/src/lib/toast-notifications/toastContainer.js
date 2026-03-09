import React, { Component } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import Toast from "./toast";
import { createStyles } from "~/theme";
import withHooks from "~/hoc/withHooks";

class ToastContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toasts: [],
    };
  }

  static defaultProps = {
    placement: "bottom",
    offset: 10,
    swipeEnabled: true,
  };

  /**
   * Shows a new toast. Returns id
   */
  show = (message, toastOptions) => {
    let id = toastOptions?.id || Math.random().toString();
    const onDestroy = () => {
      toastOptions?.onClose && toastOptions?.onClose();
      this.setState({ toasts: this.state.toasts.filter((t) => t.id !== id) });
    };

    const keepPrevious = toastOptions?.hidePrevious || false;

    requestAnimationFrame(() => {
      this.setState({
        toasts: [
          {
            id,
            onDestroy,
            message,
            open: true,
            onHide: () => this.hide(id),
            ...this.props,
            ...toastOptions,
          },
          ...(keepPrevious ? this.state.toasts.filter((t) => t.open) : []),
        ],
      });
    });

    return id;
  };

  /**
   * Updates a toast, To use this create you must pass an id to show method first, then pass it here to update the toast.
   */
  update = (id, message, toastOptions) => {
    this.setState({
      toasts: this.state.toasts.map((toast) =>
        toast.id === id ? { ...toast, message, ...toastOptions } : toast,
      ),
    });
  };

  /**
   * Removes a toast from stack
   */
  hide = (id) => {
    this.setState({
      toasts: this.state.toasts.map((t) =>
        t.id === id ? { ...t, open: false } : t,
      ),
    });
  };

  /**
   * Removes all toasts in stack
   */
  hideAll = () => {
    this.setState({
      toasts: this.state.toasts.map((t) => ({ ...t, open: false })),
    });
  };

  renderBottomToasts() {
    const { toasts } = this.state;
    let { offset, offsetBottom } = this.props;
    let style = {
      bottom: offsetBottom || offset,
      justifyContent: "flex-end",
      flexDirection: "column",
    };
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "position" : undefined}
        style={[this.props.styles.container, style]}
        pointerEvents="box-none"
      >
        {toasts
          .filter((t) => !t.placement || t.placement === "bottom")
          .map((toast) => (
            <Toast key={toast.id} {...toast} container={this} />
          ))}
      </KeyboardAvoidingView>
    );
  }

  renderTopToasts() {
    const { toasts } = this.state;
    let { offset, offsetTop } = this.props;
    let style = {
      top: offsetTop || offset,
      justifyContent: "flex-start",
      flexDirection: "column-reverse",
    };
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "position" : undefined}
        style={[this.props.styles.container, style]}
        pointerEvents="box-none"
      >
        {toasts
          .filter((t) => t.placement === "top")
          .map((toast) => (
            <Toast key={toast.id} {...toast} container={this} />
          ))}
      </KeyboardAvoidingView>
    );
  }

  render() {
    return (
      <>
        {this.renderTopToasts()}
        {this.renderBottomToasts()}
      </>
    );
  }
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  container: {
    flex: 0,
    position: "absolute",
    width: "100%",
    maxWidth: "100%",
    zIndex: 999999,
    left: 0,
    right: 0,
  },
}));

export default withHooks(ToastContainer, () => {
  const styles = useStyles();
  return { styles };
});
