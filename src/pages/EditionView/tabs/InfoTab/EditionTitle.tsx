interface EditionTitleProps {
  name?: string | undefined;
}

export function EditionTitle({ name }: EditionTitleProps) {
  return (
    <div className="text-center space-y-2 md:space-y-4">
      <p className="text-lg md:text-xl text-purple-200 font-medium mb-2 md:mb-4">
        {name}
      </p>
    </div>
  );
}
