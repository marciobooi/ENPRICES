const FloatingMenu: React.FC = () => {
  const { t } = useTranslation();



  return (
    <div className="floating-menu">      
      <div>
        <div className="percentageContainer"></div>
        <div className="decimalsContainer"></div>
        <div className="agregatesContainer"></div>
        <div className="orderContainer"></div>
        <div className="tableContainer"></div>

   
      </div>
    </div>
  );
};

export default FloatingMenu;