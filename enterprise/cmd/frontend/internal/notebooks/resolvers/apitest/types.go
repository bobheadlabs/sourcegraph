package apitest

type Notebook struct {
	ID              string
	Title           string
	Creator         NotebookUser
	Updater         NotebookUser
	CreatedAt       string
	UpdatedAt       string
	Public          bool
	ViewerCanManage bool
	Blocks          []NotebookBlock
}

type NotebookUser struct {
	Username string
}

type NotebookBlock struct {
	Typename      string `json:"__typename"`
	ID            string
	MarkdownInput string
	QueryInput    string
	FileInput     FileInput
}

type FileInput struct {
	RepositoryName string
	FilePath       string
	Revision       *string
	LineRange      *LineRange
}

type LineRange struct {
	StartLine int32
	EndLine   int32
}

type NotebookStar struct {
	User      NotebookStarUser
	CreatedAt string
}

type NotebookStarUser struct {
	Username string
}
