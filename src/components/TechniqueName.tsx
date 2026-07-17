import techniqueArrowIcon from '../assets/icons/icn-technique-arrow.svg';

interface TechniqueNameProps {
  name: string;
  className?: string;
}

export function TechniqueName({ name, className = '' }: TechniqueNameProps) {
  const segments = name.split(/[→⇨]/);

  return (
    <span className={className}>
      <span className="sr-only">{name}</span>
      <span aria-hidden="true">
        {segments.map((segment, index) => (
          <span key={`${segment}-${index}`}>
            {index > 0 && (
              <img
                src={techniqueArrowIcon}
                alt=""
                className="inline-block w-[5px] h-2 mx-1 align-middle"
              />
            )}
            {segment}
          </span>
        ))}
      </span>
    </span>
  );
}
