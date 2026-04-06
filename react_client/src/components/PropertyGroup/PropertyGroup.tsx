import style from "./PropertyGroup.module.css";

type PropertyGroupProps = {
    title?: string;
    value?: any;
};

const PropertyGroup = ({ title, value }: PropertyGroupProps) => {
    return (
        <div className={style.propertyGroup__container}>
            <div className={style.propertyGroup__title}>{title}</div>
            <div>{value}</div>
        </div>
    );
};

export default PropertyGroup;
