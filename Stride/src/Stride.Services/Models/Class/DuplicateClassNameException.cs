namespace Stride.Services.Models.Class;

public class DuplicateClassNameException : Exception
{
    public DuplicateClassNameException(string message) : base(message) { }
}
