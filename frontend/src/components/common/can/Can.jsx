import useAccessControl from "../../../hooks/useAccessControl";

const Can = ({ permission, children }) => {
  const { can } = useAccessControl();

  return can(permission) ? children : null;
};

export default Can;
